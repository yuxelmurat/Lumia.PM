import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  foundingCutoff,
  isBillingEnabled,
  perSeatPriceFor,
  priceFor,
  trialDays,
} from "../../../apps/api/src/billing/config";

const KEYS = [
  "KANEO_CLOUD",
  "PAYTR_MERCHANT_ID",
  "PAYTR_MERCHANT_KEY",
  "PAYTR_MERCHANT_SALT",
  "PAYTR_PRICE_PERSONAL_MONTHLY",
  "PAYTR_PRICE_PERSONAL_ANNUAL",
  "PAYTR_PRICE_TEAM_MONTHLY",
  "PAYTR_PRICE_TEAM_ANNUAL",
  "BILLING_TRIAL_DAYS",
  "BILLING_FOUNDING_CUTOFF",
];

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
});

describe("billing config", () => {
  it("is disabled unless cloud + merchant credentials are set", () => {
    expect(isBillingEnabled()).toBe(false);

    process.env.KANEO_CLOUD = "true";
    expect(isBillingEnabled()).toBe(false);

    process.env.PAYTR_MERCHANT_ID = "123";
    expect(isBillingEnabled()).toBe(false);

    process.env.PAYTR_MERCHANT_KEY = "key";
    expect(isBillingEnabled()).toBe(false);

    process.env.PAYTR_MERCHANT_SALT = "salt";
    expect(isBillingEnabled()).toBe(true);
  });

  it("stays disabled for self-hosted even with credentials present", () => {
    process.env.PAYTR_MERCHANT_ID = "123";
    process.env.PAYTR_MERCHANT_KEY = "key";
    process.env.PAYTR_MERCHANT_SALT = "salt";
    expect(isBillingEnabled()).toBe(false);
  });

  it("reads plan+interval prices in kurus", () => {
    process.env.PAYTR_PRICE_PERSONAL_MONTHLY = "40000";
    process.env.PAYTR_PRICE_TEAM_ANNUAL = "500000";

    expect(priceFor("personal", "monthly")).toBe(40000);
    expect(priceFor("team", "annual")).toBe(500000);
    expect(priceFor("personal", "annual")).toBeNull();
  });

  it("rejects unset or non-positive prices", () => {
    process.env.PAYTR_PRICE_TEAM_MONTHLY = "0";
    expect(priceFor("team", "monthly")).toBeNull();
    process.env.PAYTR_PRICE_TEAM_MONTHLY = "not-a-number";
    expect(priceFor("team", "monthly")).toBeNull();
  });

  it("uses the team plan price as the per-seat price", () => {
    process.env.PAYTR_PRICE_TEAM_MONTHLY = "50000";
    expect(perSeatPriceFor("monthly")).toBe(50000);
  });

  it("defaults trial to 14 days and reads override", () => {
    expect(trialDays()).toBe(14);
    process.env.BILLING_TRIAL_DAYS = "30";
    expect(trialDays()).toBe(30);
    process.env.BILLING_TRIAL_DAYS = "not-a-number";
    expect(trialDays()).toBe(14);
  });

  it("parses the founding cutoff date, null when unset or invalid", () => {
    expect(foundingCutoff()).toBeNull();
    process.env.BILLING_FOUNDING_CUTOFF = "2026-07-28";
    expect(foundingCutoff()?.getUTCFullYear()).toBe(2026);
    process.env.BILLING_FOUNDING_CUTOFF = "garbage";
    expect(foundingCutoff()).toBeNull();
  });
});
