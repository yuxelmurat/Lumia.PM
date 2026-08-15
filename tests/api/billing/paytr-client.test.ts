import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ENV_KEYS = [
  "PAYTR_MERCHANT_ID",
  "PAYTR_MERCHANT_KEY",
  "PAYTR_MERCHANT_SALT",
];
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
  }
  process.env.PAYTR_MERCHANT_ID = "123456";
  process.env.PAYTR_MERCHANT_KEY = "test_merchant_key";
  process.env.PAYTR_MERCHANT_SALT = "test_merchant_salt";
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function referenceHash(fields: {
  merchantOid: string;
  status: string;
  totalAmount: string;
}) {
  const payload =
    fields.merchantOid +
    process.env.PAYTR_MERCHANT_SALT +
    fields.status +
    fields.totalAmount;
  return createHmac("sha256", process.env.PAYTR_MERCHANT_KEY as string)
    .update(payload, "utf8")
    .digest("base64");
}

describe("PayTR callback hash verification", () => {
  it("accepts a correctly signed callback", async () => {
    const { verifyCallbackHash } = await import(
      "../../../apps/api/src/billing/paytr-client"
    );
    const fields = {
      merchantOid: "abc123",
      status: "success",
      totalAmount: "4000",
    };
    const hash = referenceHash(fields);

    expect(verifyCallbackHash({ ...fields, hash })).toBe(true);
  });

  it("rejects a tampered amount", async () => {
    const { verifyCallbackHash } = await import(
      "../../../apps/api/src/billing/paytr-client"
    );
    const fields = {
      merchantOid: "abc123",
      status: "success",
      totalAmount: "4000",
    };
    const hash = referenceHash(fields);

    expect(verifyCallbackHash({ ...fields, totalAmount: "999999", hash })).toBe(
      false,
    );
  });

  it("rejects a tampered status", async () => {
    const { verifyCallbackHash } = await import(
      "../../../apps/api/src/billing/paytr-client"
    );
    const fields = {
      merchantOid: "abc123",
      status: "success",
      totalAmount: "4000",
    };
    const hash = referenceHash(fields);

    expect(verifyCallbackHash({ ...fields, status: "failed", hash })).toBe(
      false,
    );
  });

  it("rejects a garbage hash", async () => {
    const { verifyCallbackHash } = await import(
      "../../../apps/api/src/billing/paytr-client"
    );
    expect(
      verifyCallbackHash({
        merchantOid: "abc123",
        status: "success",
        totalAmount: "4000",
        hash: "not-a-real-hash",
      }),
    ).toBe(false);
  });
});
