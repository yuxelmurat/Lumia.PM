import { createId } from "@paralleldrive/cuid2";
import { count, eq } from "drizzle-orm";
import db from "../../database";
import {
  billingChargeTable,
  workspaceBillingTable,
  workspaceUserTable,
} from "../../database/schema";
import {
  type BillingInterval,
  isBillingEnabled,
  perSeatPriceFor,
} from "../config";
import { chargeStoredCard } from "../paytr-client";
import { getWorkspaceOwnerEmail } from "./workspace-owner";

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS: Record<BillingInterval, number> = {
  monthly: 30,
  annual: 365,
};

/**
 * Prorated cost, in kurus, for adding `extraSeats` for the remaining days of
 * the current period. Team plan seat prices are already per-seat (the same
 * assumption the old Creem `units` line item made), so this is just the
 * per-seat price times the fraction of the period left, rounded to the
 * nearest kurus.
 */
export function proratedSeatTopUp(input: {
  extraSeats: number;
  interval: BillingInterval;
  currentPeriodEnd: Date;
  now?: Date;
}) {
  const perSeat = perSeatPriceFor(input.interval);
  if (!perSeat) {
    return 0;
  }
  const now = input.now ?? new Date();
  const periodDays = PERIOD_DAYS[input.interval];
  const daysRemaining = Math.max(
    0,
    Math.min(
      periodDays,
      Math.ceil((input.currentPeriodEnd.getTime() - now.getTime()) / DAY_MS),
    ),
  );
  return Math.round((perSeat * input.extraSeats * daysRemaining) / periodDays);
}

export async function syncWorkspaceSeats(workspaceId: string) {
  if (!isBillingEnabled()) {
    return;
  }

  const [billing] = await db
    .select()
    .from(workspaceBillingTable)
    .where(eq(workspaceBillingTable.workspaceId, workspaceId));

  if (
    !billing?.paytrCardToken ||
    billing.plan !== "team" ||
    !billing.currentPeriodEnd ||
    (billing.status !== "active" && billing.status !== "trialing")
  ) {
    return;
  }

  const [members] = await db
    .select({ value: count() })
    .from(workspaceUserTable)
    .where(eq(workspaceUserTable.workspaceId, workspaceId));

  const seats = Math.max(1, members?.value ?? 1);
  if (seats === billing.seats) {
    return;
  }

  if (seats < billing.seats) {
    // Decrease: no refund, just record the lower count for next renewal.
    await db
      .update(workspaceBillingTable)
      .set({ seats })
      .where(eq(workspaceBillingTable.workspaceId, workspaceId));
    return;
  }

  const interval = (billing.billingInterval as BillingInterval) ?? "monthly";
  const extraSeats = seats - billing.seats;
  const amountKurus = proratedSeatTopUp({
    extraSeats,
    interval,
    currentPeriodEnd: billing.currentPeriodEnd,
  });

  if (amountKurus <= 0) {
    // Nothing owed for the remaining period (e.g. renewal is due today);
    // still safe to record the new count immediately.
    await db
      .update(workspaceBillingTable)
      .set({ seats })
      .where(eq(workspaceBillingTable.workspaceId, workspaceId));
    return;
  }

  const merchantOid = createId();
  await db.insert(billingChargeTable).values({
    id: merchantOid,
    workspaceId,
    kind: "seat_topup",
    plan: billing.plan,
    billingInterval: interval,
    seats,
    amountKurus,
  });

  try {
    const email =
      (await getWorkspaceOwnerEmail(workspaceId)) ?? "billing@lumia.pm";
    const result = await chargeStoredCard({
      merchantOid,
      userIp: "0.0.0.0", // server-initiated; PayTR accepts a placeholder IP for unattended charges
      email,
      amountKurus,
      utoken: billing.paytrCardToken,
      ctoken: billing.paytrCardTokenId,
    });

    if (!result.ok) {
      console.error(
        `billing: seat top-up charge failed for workspace ${workspaceId}: ${result.reason}`,
      );
      return;
    }
    // Seat count is NOT persisted here: the bildirim callback for this
    // merchant_oid is the source of truth and updates it on confirmed
    // success, matching the checkout/renewal flow.
  } catch (error) {
    console.error(
      `billing: seat top-up charge request failed for workspace ${workspaceId}`,
      error,
    );
  }
}
