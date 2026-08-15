import { and, eq, isNull, sql } from "drizzle-orm";
import db from "../../database";
import { billingChargeTable, billingEventTable } from "../../database/schema";
import type { BillingInterval } from "../config";

/** Advances a period-end date by one billing interval. */
export function advancePeriodEnd(from: Date, interval: BillingInterval): Date {
  const next = new Date(from);
  if (interval === "annual") {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

/**
 * True when a `kind` charge for this workspace was created within
 * `windowMs` and hasn't yet received its bildirim callback. PayTR's
 * callback can be delayed (it retries server-side for up to 24h), so every
 * charge-issuing path must check this before creating a new merchant_oid —
 * otherwise a second trigger (another member joining before the first
 * top-up's callback lands, or the next scheduler tick before a renewal's
 * callback lands) charges the same thing twice.
 */
export async function hasPendingCharge(
  workspaceId: string,
  kind: string,
  windowMs: number,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowMs);
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
        eq(billingChargeTable.kind, kind),
        sql`${billingChargeTable.createdAt} >= ${cutoff}`,
        isNull(billingEventTable.id),
      ),
    )
    .limit(1);
  return Boolean(pending);
}
