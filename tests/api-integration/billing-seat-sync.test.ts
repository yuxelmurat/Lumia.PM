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

import { syncWorkspaceSeats } from "../../apps/api/src/billing/controllers/sync-seats";
import db, { schema } from "../../apps/api/src/database";
import { resetTestDatabase } from "./helpers/database";
import { createWorkspaceMember } from "./helpers/fixtures";

const CLOUD_ENV = {
  KANEO_CLOUD: "true",
  PAYTR_MERCHANT_ID: "123",
  PAYTR_MERCHANT_KEY: "paytr_test_dummy",
  PAYTR_MERCHANT_SALT: "paytr_salt_dummy",
  PAYTR_PRICE_TEAM_MONTHLY: "50000",
};
const saved: Record<string, string | undefined> = {};

async function addMember(workspaceId: string) {
  const member = await createWorkspaceMember();
  await db.insert(schema.workspaceUserTable).values({
    workspaceId,
    userId: member.user.id,
    role: "member",
    joinedAt: new Date(),
  });
}

const FAR_FUTURE = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

async function teamBilling(workspaceId: string, seats: number) {
  await db.insert(schema.workspaceBillingTable).values({
    workspaceId,
    plan: "team",
    billingInterval: "monthly",
    status: "active",
    seats,
    paytrCardToken: `utoken-${workspaceId}`,
    currentPeriodEnd: FAR_FUTURE,
  });
}

async function seatsOf(workspaceId: string) {
  const [row] = await db
    .select()
    .from(schema.workspaceBillingTable)
    .where(eq(schema.workspaceBillingTable.workspaceId, workspaceId));
  return row.seats;
}

describe("API integration: seat sync", () => {
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
  });

  it("charges a prorated top-up on a seat increase without persisting seats yet", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await teamBilling(owner.workspace.id, 1);
    await addMember(owner.workspace.id); // now 2 members

    await syncWorkspaceSeats(owner.workspace.id);

    expect(chargeStoredCard).toHaveBeenCalledTimes(1);
    const call = chargeStoredCard.mock.calls[0]?.[0] as {
      utoken: string;
      amountKurus: number;
    };
    expect(call.utoken).toBe(`utoken-${owner.workspace.id}`);
    expect(call.amountKurus).toBeGreaterThan(0);
    // Seats are only persisted once the bildirim callback confirms the
    // charge, not by this call itself.
    expect(await seatsOf(owner.workspace.id)).toBe(1);
  });

  it("records a seat decrease immediately without charging", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await teamBilling(owner.workspace.id, 5);

    await syncWorkspaceSeats(owner.workspace.id);

    expect(chargeStoredCard).not.toHaveBeenCalled();
    expect(await seatsOf(owner.workspace.id)).toBe(1);
  });

  it("does nothing when the seat count already matches", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await teamBilling(owner.workspace.id, 1); // 1 member, seats already 1

    await syncWorkspaceSeats(owner.workspace.id);
    expect(chargeStoredCard).not.toHaveBeenCalled();
  });

  it("skips personal plans", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await db.insert(schema.workspaceBillingTable).values({
      workspaceId: owner.workspace.id,
      plan: "personal",
      status: "active",
      seats: 1,
      paytrCardToken: `utoken-${owner.workspace.id}`,
      currentPeriodEnd: FAR_FUTURE,
    });
    await addMember(owner.workspace.id);

    await syncWorkspaceSeats(owner.workspace.id);
    expect(chargeStoredCard).not.toHaveBeenCalled();
  });

  it("skips workspaces without an active subscription", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await db.insert(schema.workspaceBillingTable).values({
      workspaceId: owner.workspace.id,
      plan: "team",
      status: "canceled",
      seats: 1,
      paytrCardToken: `utoken-${owner.workspace.id}`,
      currentPeriodEnd: FAR_FUTURE,
    });
    await addMember(owner.workspace.id);

    await syncWorkspaceSeats(owner.workspace.id);
    expect(chargeStoredCard).not.toHaveBeenCalled();
  });

  it("leaves the previous seat count when the top-up charge fails", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await teamBilling(owner.workspace.id, 1);
    await addMember(owner.workspace.id);
    chargeStoredCard.mockImplementationOnce(async () => ({
      ok: false as const,
      reason: "declined",
    }));

    await syncWorkspaceSeats(owner.workspace.id);

    expect(await seatsOf(owner.workspace.id)).toBe(1);
  });
});
