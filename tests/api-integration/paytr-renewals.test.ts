import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { chargeStoredCard } = vi.hoisted(() => ({
  chargeStoredCard: vi.fn(async () => ({ ok: true as const })),
}));
vi.mock("../../apps/api/src/billing/paytr-client", () => ({
  chargeStoredCard,
  buildCardStorageCheckoutForm: vi.fn(),
  verifyCallbackHash: vi.fn(),
}));

const sendNotificationEmail = vi.fn(async () => ({ success: true as const }));
vi.mock("@kaneo/email", () => ({
  isSmtpConfigured: () => true,
  sendNotificationEmail: (...args: unknown[]) => sendNotificationEmail(...args),
}));

import db, { schema } from "../../apps/api/src/database";
import { processPaytrRenewals } from "../../apps/api/src/scheduler/paytr-renewals";
import { resetTestDatabase } from "./helpers/database";
import { createWorkspaceMember } from "./helpers/fixtures";

const CLOUD_ENV = {
  KANEO_CLOUD: "true",
  PAYTR_MERCHANT_ID: "123",
  PAYTR_MERCHANT_KEY: "paytr_test_dummy",
  PAYTR_MERCHANT_SALT: "paytr_salt_dummy",
  PAYTR_PRICE_PERSONAL_MONTHLY: "4000",
};
const saved: Record<string, string | undefined> = {};

const OVERDUE = new Date(Date.now() - 60_000);

async function readBilling(workspaceId: string) {
  const [row] = await db
    .select()
    .from(schema.workspaceBillingTable)
    .where(eq(schema.workspaceBillingTable.workspaceId, workspaceId));
  return row;
}

async function dueBilling(
  workspaceId: string,
  overrides: Partial<typeof schema.workspaceBillingTable.$inferInsert> = {},
) {
  await db.insert(schema.workspaceBillingTable).values({
    workspaceId,
    plan: "personal",
    billingInterval: "monthly",
    status: "active",
    seats: 1,
    paytrCardToken: `utoken-${workspaceId}`,
    currentPeriodEnd: OVERDUE,
    ...overrides,
  });
}

describe("API integration: PayTR renewal scheduler", () => {
  beforeAll(() => {
    for (const [k, v] of Object.entries(CLOUD_ENV)) {
      saved[k] = process.env[k];
      process.env[k] = v;
    }
  });
  afterAll(() => {
    for (const k of Object.keys(CLOUD_ENV)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });
  beforeEach(async () => {
    await resetTestDatabase();
    chargeStoredCard.mockClear();
    chargeStoredCard.mockImplementation(async () => ({ ok: true as const }));
    sendNotificationEmail.mockClear();
  });

  it("charges the stored card for an overdue workspace and records the attempt", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await dueBilling(owner.workspace.id);

    await processPaytrRenewals();

    expect(chargeStoredCard).toHaveBeenCalledWith(
      expect.objectContaining({
        utoken: `utoken-${owner.workspace.id}`,
        amountKurus: 4000,
      }),
    );
    const billing = await readBilling(owner.workspace.id);
    expect(billing.status).toBe("past_due"); // webhook flips it back to active on success
    expect(billing.renewalAttempts).toBe(1);
  });

  it("skips workspaces that already have a renewal charge in flight", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await dueBilling(owner.workspace.id);
    await db.insert(schema.billingChargeTable).values({
      id: "already-pending",
      workspaceId: owner.workspace.id,
      kind: "renewal",
      amountKurus: 4000,
    });

    await processPaytrRenewals();

    expect(chargeStoredCard).not.toHaveBeenCalled();
  });

  it("notifies the owner and stays past_due when a charge is declined", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await dueBilling(owner.workspace.id);
    chargeStoredCard.mockResolvedValueOnce({
      ok: false,
      reason: "declined",
    });

    await processPaytrRenewals();

    expect(sendNotificationEmail).toHaveBeenCalledTimes(1);
    const billing = await readBilling(owner.workspace.id);
    expect(billing.status).toBe("past_due");
    expect(billing.renewalAttempts).toBe(1);
  });

  it("expires the workspace after exhausting retries past the grace window", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await dueBilling(owner.workspace.id, {
      status: "past_due",
      renewalAttempts: 3,
      renewalFirstFailedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    });

    await processPaytrRenewals();

    expect(chargeStoredCard).not.toHaveBeenCalled();
    const billing = await readBilling(owner.workspace.id);
    expect(billing.status).toBe("expired");
    expect(sendNotificationEmail).toHaveBeenCalledTimes(1);
  });

  it("keeps retrying within the grace window without expiring", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await dueBilling(owner.workspace.id, {
      status: "past_due",
      renewalAttempts: 1,
      renewalFirstFailedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    await processPaytrRenewals();

    expect(chargeStoredCard).toHaveBeenCalledTimes(1);
    const billing = await readBilling(owner.workspace.id);
    expect(billing.status).toBe("past_due");
    expect(billing.renewalAttempts).toBe(2);
  });

  it("ignores canceled subscriptions", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await dueBilling(owner.workspace.id, { canceledAt: new Date() });

    await processPaytrRenewals();

    expect(chargeStoredCard).not.toHaveBeenCalled();
  });

  it("ignores workspaces without a stored card", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await dueBilling(owner.workspace.id, { paytrCardToken: null });

    await processPaytrRenewals();

    expect(chargeStoredCard).not.toHaveBeenCalled();
  });
});
