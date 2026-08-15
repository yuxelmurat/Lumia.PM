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
