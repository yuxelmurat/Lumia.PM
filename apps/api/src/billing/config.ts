import { isCloud } from "../utils/is-cloud";

export type Plan = "personal" | "team";
export type BillingInterval = "monthly" | "annual";

// PayTR has no product catalog: prices live in env vars, expressed in kurus
// (TRY x100) since that's the smallest unit PayTR's payment_amount expects.
const PRICE_ENV_KEYS: Record<Plan, Record<BillingInterval, string>> = {
  personal: {
    monthly: "PAYTR_PRICE_PERSONAL_MONTHLY",
    annual: "PAYTR_PRICE_PERSONAL_ANNUAL",
  },
  team: {
    monthly: "PAYTR_PRICE_TEAM_MONTHLY",
    annual: "PAYTR_PRICE_TEAM_ANNUAL",
  },
};

export function isBillingEnabled() {
  return Boolean(
    isCloud() &&
      process.env.PAYTR_MERCHANT_ID &&
      process.env.PAYTR_MERCHANT_KEY &&
      process.env.PAYTR_MERCHANT_SALT,
  );
}

export function paytrTestMode() {
  return process.env.PAYTR_TEST_MODE === "true";
}

export function paytrMerchantId() {
  return process.env.PAYTR_MERCHANT_ID ?? "";
}

export function paytrMerchantKey() {
  return process.env.PAYTR_MERCHANT_KEY ?? "";
}

export function paytrMerchantSalt() {
  return process.env.PAYTR_MERCHANT_SALT ?? "";
}

export function paytrCurrency() {
  return process.env.PAYTR_CURRENCY ?? "TL";
}

export function trialDays() {
  const parsed = Number.parseInt(process.env.BILLING_TRIAL_DAYS ?? "14", 10);
  return Number.isNaN(parsed) ? 14 : parsed;
}

export function foundingCutoff(): Date | null {
  const raw = process.env.BILLING_FOUNDING_CUTOFF;
  if (!raw) {
    return null;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Price for a plan/interval in kurus (TRY x100), or null when unconfigured. */
export function priceFor(plan: Plan, interval: BillingInterval): number | null {
  const raw = process.env[PRICE_ENV_KEYS[plan][interval]];
  if (!raw) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

/**
 * Per-seat price in kurus for the team plan. The team price env vars are
 * already defined per-seat (matching how the old Creem `units` line item
 * priced each seat individually), so this is just `priceFor("team", ...)`.
 */
export function perSeatPriceFor(interval: BillingInterval): number | null {
  return priceFor("team", interval);
}
