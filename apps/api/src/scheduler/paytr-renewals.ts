import { isSmtpConfigured, sendNotificationEmail } from "@kaneo/email";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import {
  type BillingInterval,
  isBillingEnabled,
  priceFor,
} from "../billing/config";
import { getWorkspaceOwnerEmail } from "../billing/controllers/workspace-owner";
import { chargeStoredCard } from "../billing/paytr-client";
import db from "../database";
import {
  billingChargeTable,
  billingEventTable,
  workspaceBillingTable,
  workspaceTable,
} from "../database/schema";

const BATCH_SIZE = 100;
const MAX_RENEWAL_ATTEMPTS = 3;
const GRACE_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;
// Skip a workspace whose most recent renewal charge is still awaiting its
// bildirim callback, so an in-flight charge from this tick (or a slow
// callback) can't be double-charged by the next one.
const PENDING_CHARGE_WINDOW_MS = 55 * 60 * 1000;

function clientUrl() {
  return (process.env.KANEO_CLIENT_URL ?? "https://cloud.kaneo.app").replace(
    /\/$/,
    "",
  );
}

async function findDueWorkspaces() {
  return db
    .select({
      workspaceId: workspaceBillingTable.workspaceId,
      workspaceName: workspaceTable.name,
      plan: workspaceBillingTable.plan,
      billingInterval: workspaceBillingTable.billingInterval,
      seats: workspaceBillingTable.seats,
      currentPeriodEnd: workspaceBillingTable.currentPeriodEnd,
      paytrCardToken: workspaceBillingTable.paytrCardToken,
      paytrCardTokenId: workspaceBillingTable.paytrCardTokenId,
      renewalAttempts: workspaceBillingTable.renewalAttempts,
      renewalFirstFailedAt: workspaceBillingTable.renewalFirstFailedAt,
    })
    .from(workspaceBillingTable)
    .innerJoin(
      workspaceTable,
      eq(workspaceTable.id, workspaceBillingTable.workspaceId),
    )
    .where(
      and(
        inArray(workspaceBillingTable.status, ["active", "past_due"]),
        isNull(workspaceBillingTable.canceledAt),
        isNotNull(workspaceBillingTable.paytrCardToken),
        isNotNull(workspaceBillingTable.currentPeriodEnd),
        lte(workspaceBillingTable.currentPeriodEnd, new Date()),
      ),
    )
    .limit(BATCH_SIZE);
}

async function hasPendingCharge(workspaceId: string) {
  const cutoff = new Date(Date.now() - PENDING_CHARGE_WINDOW_MS);
  const [pending] = await db
    .select({ id: billingChargeTable.id })
    .from(billingChargeTable)
    .leftJoin(
      billingEventTable,
      eq(billingEventTable.id, billingChargeTable.id),
    )
    .where(
      and(
        eq(billingChargeTable.workspaceId, workspaceId),
        eq(billingChargeTable.kind, "renewal"),
        sql`${billingChargeTable.createdAt} >= ${cutoff}`,
        isNull(billingEventTable.id),
      ),
    )
    .limit(1);
  return Boolean(pending);
}

async function notifyOwner(
  workspaceId: string,
  workspaceName: string,
  kind: "failed" | "expired",
) {
  if (!isSmtpConfigured()) {
    return;
  }
  const email = await getWorkspaceOwnerEmail(workspaceId);
  if (!email) {
    return;
  }
  const billingUrl = `${clientUrl()}/dashboard/settings/workspace/billing`;
  if (kind === "failed") {
    await sendNotificationEmail(
      email,
      `We couldn't renew your ${workspaceName} subscription`,
      {
        title: "Payment failed",
        message: `We tried to charge your stored card for ${workspaceName} and it didn't go through. We'll retry over the next few days — update your payment details to avoid an interruption.`,
        actionUrl: billingUrl,
        actionLabel: "Update payment method",
      },
    );
  } else {
    await sendNotificationEmail(
      email,
      `Your ${workspaceName} subscription has expired`,
      {
        title: "Subscription expired",
        message: `We couldn't renew ${workspaceName} after several attempts, so its Lumia.PM Cloud subscription has expired. Resubscribe any time to keep creating and editing.`,
        actionUrl: billingUrl,
        actionLabel: "Resubscribe",
      },
    );
  }
}

async function processWorkspace(
  row: Awaited<ReturnType<typeof findDueWorkspaces>>[number],
) {
  if (await hasPendingCharge(row.workspaceId)) {
    return;
  }

  const attempts = row.renewalAttempts + 1;
  const firstFailedAt = row.renewalFirstFailedAt ?? new Date();
  const graceExpired =
    attempts > MAX_RENEWAL_ATTEMPTS ||
    Date.now() - firstFailedAt.getTime() >= GRACE_WINDOW_MS;

  if (graceExpired) {
    await db
      .update(workspaceBillingTable)
      .set({ status: "expired" })
      .where(eq(workspaceBillingTable.workspaceId, row.workspaceId));
    await notifyOwner(row.workspaceId, row.workspaceName, "expired");
    return;
  }

  const interval = (row.billingInterval as BillingInterval) ?? "monthly";
  const unitPrice = priceFor(
    (row.plan as "personal" | "team") ?? "personal",
    interval,
  );
  if (!unitPrice || !row.paytrCardToken) {
    return;
  }
  const amountKurus = unitPrice * Math.max(1, row.seats);

  const merchantOid = createId();
  await db.insert(billingChargeTable).values({
    id: merchantOid,
    workspaceId: row.workspaceId,
    kind: "renewal",
    plan: row.plan,
    billingInterval: interval,
    seats: row.seats,
    amountKurus,
  });

  // Optimistically record this as an attempt now: on success the webhook
  // resets attempts/status when its callback lands; on failure (thrown or a
  // synchronous decline) this attempt already counts, and the next tick will
  // find the still-overdue currentPeriodEnd and try again.
  await db
    .update(workspaceBillingTable)
    .set({
      status: "past_due",
      renewalAttempts: attempts,
      renewalFirstFailedAt: firstFailedAt,
    })
    .where(eq(workspaceBillingTable.workspaceId, row.workspaceId));

  const email = (await getWorkspaceOwnerEmail(row.workspaceId)) ?? "";

  try {
    const result = await chargeStoredCard({
      merchantOid,
      userIp: "0.0.0.0",
      email,
      amountKurus,
      utoken: row.paytrCardToken,
      ctoken: row.paytrCardTokenId,
    });
    if (!result.ok) {
      console.error(
        `billing: renewal charge declined for workspace ${row.workspaceId}: ${result.reason}`,
      );
      await notifyOwner(row.workspaceId, row.workspaceName, "failed");
    }
  } catch (error) {
    console.error(
      `billing: renewal charge request failed for workspace ${row.workspaceId}`,
      error,
    );
    await notifyOwner(row.workspaceId, row.workspaceName, "failed");
  }
}

export async function processPaytrRenewals(): Promise<void> {
  if (!isBillingEnabled()) {
    return;
  }

  let due: Awaited<ReturnType<typeof findDueWorkspaces>>;
  try {
    due = await findDueWorkspaces();
  } catch (error) {
    console.error("billing: renewal query failed", error);
    return;
  }

  if (due.length === 0) {
    return;
  }

  for (const row of due) {
    try {
      await processWorkspace(row);
    } catch (error) {
      console.error(
        `billing: renewal processing failed for workspace ${row.workspaceId}`,
        error,
      );
    }
  }
}
