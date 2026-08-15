import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import handleCallback from "../../apps/api/src/billing/controllers/handle-webhook";
import db, { schema } from "../../apps/api/src/database";
import { resetTestDatabase } from "./helpers/database";
import { createWorkspaceMember } from "./helpers/fixtures";

const MERCHANT_KEY = "paytr_test_dummy";
const MERCHANT_SALT = "paytr_salt_dummy";

process.env.PAYTR_MERCHANT_ID = "123";
process.env.PAYTR_MERCHANT_KEY = MERCHANT_KEY;
process.env.PAYTR_MERCHANT_SALT = MERCHANT_SALT;

function sign(merchantOid: string, status: string, totalAmount: string) {
  const payload = merchantOid + MERCHANT_SALT + status + totalAmount;
  return createHmac("sha256", MERCHANT_KEY)
    .update(payload, "utf8")
    .digest("base64");
}

function callbackBody(
  merchantOid: string,
  status: "success" | "failed",
  totalAmount = "4000",
  extra: Record<string, string> = {},
) {
  return {
    merchant_oid: merchantOid,
    status,
    total_amount: totalAmount,
    hash: sign(merchantOid, status, totalAmount),
    ...extra,
  };
}

async function seedCharge(
  overrides: Partial<typeof schema.billingChargeTable.$inferInsert> & {
    id: string;
    workspaceId: string;
  },
) {
  await db.insert(schema.billingChargeTable).values({
    kind: "checkout",
    plan: "team",
    billingInterval: "monthly",
    seats: 1,
    amountKurus: 4000,
    ...overrides,
  });
}

async function readBilling(workspaceId: string) {
  const [row] = await db
    .select()
    .from(schema.workspaceBillingTable)
    .where(eq(schema.workspaceBillingTable.workspaceId, workspaceId));
  return row;
}

describe("API integration: PayTR billing callback", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("rejects a callback with an invalid hash", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await seedCharge({ id: "oid-1", workspaceId: owner.workspace.id });

    const result = await handleCallback({
      merchant_oid: "oid-1",
      status: "success",
      total_amount: "4000",
      hash: "tampered",
    });

    expect(result.ok).toBe(false);
    expect(await db.select().from(schema.billingEventTable)).toHaveLength(0);
  });

  it("activates billing and stores the card token on a successful checkout", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await db.insert(schema.workspaceBillingTable).values({
      workspaceId: owner.workspace.id,
    });
    await seedCharge({
      id: "oid-checkout",
      workspaceId: owner.workspace.id,
      plan: "team",
      billingInterval: "monthly",
      seats: 2,
    });

    const result = await handleCallback(
      callbackBody("oid-checkout", "success", "4000", { utoken: "utoken-abc" }),
    );

    expect(result).toEqual({ ok: true, processed: true, duplicate: false });
    const billing = await readBilling(owner.workspace.id);
    expect(billing.status).toBe("active");
    expect(billing.plan).toBe("team");
    expect(billing.seats).toBe(2);
    expect(billing.paytrCardToken).toBe("utoken-abc");
    expect(billing.currentPeriodEnd).not.toBeNull();
  });

  it("does not activate billing on a failed checkout", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await db.insert(schema.workspaceBillingTable).values({
      workspaceId: owner.workspace.id,
    });
    await seedCharge({ id: "oid-fail", workspaceId: owner.workspace.id });

    await handleCallback(callbackBody("oid-fail", "failed"));

    const billing = await readBilling(owner.workspace.id);
    expect(billing.status).toBeNull();
  });

  it("applies a merchant_oid once and suppresses the replay", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await db.insert(schema.workspaceBillingTable).values({
      workspaceId: owner.workspace.id,
      status: "active",
      plan: "team",
      seats: 1,
    });
    await seedCharge({ id: "oid-dup", workspaceId: owner.workspace.id });
    const body = callbackBody("oid-dup", "success");

    expect(await handleCallback(body)).toEqual({
      ok: true,
      processed: true,
      duplicate: false,
    });
    expect(await handleCallback(body)).toEqual({
      ok: true,
      processed: false,
      duplicate: true,
    });

    expect(await db.select().from(schema.billingEventTable)).toHaveLength(1);
  });

  it("advances the period end on a successful renewal", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    const periodEnd = new Date("2026-08-01T00:00:00.000Z");
    await db.insert(schema.workspaceBillingTable).values({
      workspaceId: owner.workspace.id,
      status: "past_due",
      plan: "personal",
      billingInterval: "monthly",
      seats: 1,
      currentPeriodEnd: periodEnd,
      renewalAttempts: 2,
      renewalFirstFailedAt: new Date("2026-07-28T00:00:00.000Z"),
    });
    await seedCharge({
      id: "oid-renew",
      workspaceId: owner.workspace.id,
      kind: "renewal",
      plan: "personal",
      billingInterval: "monthly",
    });

    await handleCallback(callbackBody("oid-renew", "success"));

    const billing = await readBilling(owner.workspace.id);
    expect(billing.status).toBe("active");
    expect(billing.currentPeriodEnd?.toISOString()).toBe(
      "2026-09-01T00:00:00.000Z",
    );
    expect(billing.renewalAttempts).toBe(0);
    expect(billing.renewalFirstFailedAt).toBeNull();
  });

  it("leaves past_due state untouched on a failed renewal callback (scheduler owns retries)", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await db.insert(schema.workspaceBillingTable).values({
      workspaceId: owner.workspace.id,
      status: "past_due",
      plan: "personal",
      billingInterval: "monthly",
      seats: 1,
      renewalAttempts: 1,
    });
    await seedCharge({
      id: "oid-renew-fail",
      workspaceId: owner.workspace.id,
      kind: "renewal",
    });

    await handleCallback(callbackBody("oid-renew-fail", "failed"));

    const billing = await readBilling(owner.workspace.id);
    expect(billing.status).toBe("past_due");
    expect(billing.renewalAttempts).toBe(1);
  });

  it("ignores a callback for an unknown merchant_oid instead of throwing", async () => {
    const result = await handleCallback(callbackBody("no-such-oid", "success"));
    expect(result).toEqual({ ok: true, processed: false, duplicate: false });
  });
});
