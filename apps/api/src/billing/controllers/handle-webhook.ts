import { eq } from "drizzle-orm";
import db from "../../database";
import {
  billingChargeTable,
  billingEventTable,
  workspaceBillingTable,
} from "../../database/schema";
import type { BillingInterval, Plan } from "../config";
import { verifyCallbackHash } from "../paytr-client";
import { advancePeriodEnd } from "./renewal-helpers";

export type PaytrCallbackBody = Record<string, string>;

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function applyCharge(
  body: PaytrCallbackBody,
  charge: typeof billingChargeTable.$inferSelect,
  tx: DbOrTx,
) {
  const succeeded = body.status === "success";
  const plan = charge.plan as Plan | null;
  const interval = charge.billingInterval as BillingInterval | null;

  if (charge.kind === "checkout") {
    if (!succeeded) {
      return;
    }
    await tx
      .update(workspaceBillingTable)
      .set({
        status: "active",
        plan,
        billingInterval: interval,
        seats: charge.seats ?? 1,
        paytrCardToken: body.utoken || undefined,
        paytrCardTokenId: body.ctoken || undefined,
        currentPeriodEnd: advancePeriodEnd(new Date(), interval ?? "monthly"),
        canceledAt: null,
        renewalAttempts: 0,
        renewalFirstFailedAt: null,
      })
      .where(eq(workspaceBillingTable.workspaceId, charge.workspaceId));
    return;
  }

  if (charge.kind === "renewal") {
    const [billing] = await tx
      .select()
      .from(workspaceBillingTable)
      .where(eq(workspaceBillingTable.workspaceId, charge.workspaceId));
    if (!billing) {
      return;
    }

    if (succeeded) {
      await tx
        .update(workspaceBillingTable)
        .set({
          status: "active",
          currentPeriodEnd: advancePeriodEnd(
            billing.currentPeriodEnd ?? new Date(),
            (billing.billingInterval as BillingInterval) ?? "monthly",
          ),
          renewalAttempts: 0,
          renewalFirstFailedAt: null,
        })
        .where(eq(workspaceBillingTable.workspaceId, charge.workspaceId));
    }
    // Failure is handled by the renewal scheduler itself (it owns the
    // retry/grace-window bookkeeping and re-checks status on its next run),
    // so a failed callback here is intentionally a no-op.
    return;
  }

  if (charge.kind === "seat_topup") {
    if (!succeeded) {
      // Keep the previous seat count; the caller already avoided persisting
      // the increase until this callback confirms the top-up charge.
      return;
    }
    await tx
      .update(workspaceBillingTable)
      .set({ seats: charge.seats ?? undefined })
      .where(eq(workspaceBillingTable.workspaceId, charge.workspaceId));
  }
}

async function handleCallback(body: PaytrCallbackBody) {
  const merchantOid = body.merchant_oid ?? "";
  const status = body.status ?? "";
  const totalAmount = body.total_amount ?? "";
  const hash = body.hash ?? "";

  if (
    !verifyCallbackHash({
      merchantOid,
      status,
      totalAmount,
      hash,
    })
  ) {
    console.error("billing: callback hash verification failed", {
      merchantOid,
    });
    return { ok: false as const, reason: "Invalid signature" };
  }

  // A claim that outlives a failed apply makes the retry look like a
  // duplicate, so the insert and the apply share a transaction.
  const result = await db.transaction(async (tx) => {
    const [claimed] = await tx
      .insert(billingEventTable)
      .values({ id: merchantOid, eventType: `paytr.${status}` })
      .onConflictDoNothing({ target: billingEventTable.id })
      .returning();

    if (!claimed) {
      return { processed: false, duplicate: true };
    }

    const [charge] = await tx
      .select()
      .from(billingChargeTable)
      .where(eq(billingChargeTable.id, merchantOid));

    if (!charge) {
      console.error("billing: callback for unknown merchant_oid", {
        merchantOid,
      });
      return { processed: false, duplicate: false };
    }

    await applyCharge(body, charge, tx);
    return { processed: true, duplicate: false };
  });

  return { ok: true as const, ...result };
}

export default handleCallback;
