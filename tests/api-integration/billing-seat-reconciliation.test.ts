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

import db, { schema } from "../../apps/api/src/database";
import { reconcileWorkspaceSeats } from "../../apps/api/src/scheduler/seat-reconciliation";
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

const FAR_FUTURE = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

async function addMember(workspaceId: string) {
  const member = await createWorkspaceMember();
  await db.insert(schema.workspaceUserTable).values({
    workspaceId,
    userId: member.user.id,
    role: "member",
    joinedAt: new Date(),
  });
}

async function billing(
  workspaceId: string,
  overrides: Partial<typeof schema.workspaceBillingTable.$inferInsert> = {},
) {
  await db.insert(schema.workspaceBillingTable).values({
    workspaceId,
    plan: "team",
    billingInterval: "monthly",
    status: "active",
    seats: 1,
    paytrCardToken: `utoken-${workspaceId}`,
    currentPeriodEnd: FAR_FUTURE,
    ...overrides,
  });
}

async function seatsOf(workspaceId: string) {
  const [row] = await db
    .select()
    .from(schema.workspaceBillingTable)
    .where(eq(schema.workspaceBillingTable.workspaceId, workspaceId));
  return row.seats;
}

describe("API integration: seat reconciliation", () => {
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

  it("charges a top-up for a workspace whose seat count drifted upward", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await billing(owner.workspace.id, { seats: 1 });
    await addMember(owner.workspace.id);
    await addMember(owner.workspace.id); // 3 members, still billed for 1

    await reconcileWorkspaceSeats();

    expect(chargeStoredCard).toHaveBeenCalledWith(
      expect.objectContaining({ utoken: `utoken-${owner.workspace.id}` }),
    );
    // seats are only bumped once the callback confirms the charge
    expect(await seatsOf(owner.workspace.id)).toBe(1);
  });

  it("repairs drift downwards after members leave, without charging", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await billing(owner.workspace.id, { seats: 5 });

    await reconcileWorkspaceSeats();

    expect(chargeStoredCard).not.toHaveBeenCalled();
    expect(await seatsOf(owner.workspace.id)).toBe(1);
  });

  it("touches nothing when every workspace is already in sync", async () => {
    const owner = await createWorkspaceMember({ role: "owner" });
    await billing(owner.workspace.id, { seats: 1 });

    await reconcileWorkspaceSeats();

    expect(chargeStoredCard).not.toHaveBeenCalled();
  });

  it("ignores personal plans and inactive subscriptions", async () => {
    const personal = await createWorkspaceMember({ role: "owner" });
    await billing(personal.workspace.id, { plan: "personal", seats: 9 });

    const canceled = await createWorkspaceMember({ role: "owner" });
    await billing(canceled.workspace.id, { status: "canceled", seats: 9 });

    await reconcileWorkspaceSeats();

    expect(chargeStoredCard).not.toHaveBeenCalled();
  });

  it("keeps going when one workspace fails to sync", async () => {
    const first = await createWorkspaceMember({ role: "owner" });
    await billing(first.workspace.id, { seats: 4 }); // will decrease, no charge
    const second = await createWorkspaceMember({ role: "owner" });
    await billing(second.workspace.id, { seats: 1 });
    await addMember(second.workspace.id);
    await addMember(second.workspace.id); // will increase, charges

    chargeStoredCard.mockImplementationOnce(async () => {
      throw new Error("provider unavailable");
    });

    await expect(reconcileWorkspaceSeats()).resolves.toBeUndefined();

    expect(await seatsOf(first.workspace.id)).toBe(1);
  });
});
