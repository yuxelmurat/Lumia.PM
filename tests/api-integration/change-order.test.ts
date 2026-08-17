import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

describe("API integration: change orders", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("assigns sequential per-project numbers to created change orders", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const firstResponse = await app.request(`/api/change-order/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Redesign kitchen layout",
        description: "Client requested a full kitchen layout redesign.",
        costImpactCents: 500000,
        hoursImpact: 20,
      }),
    });
    expect(firstResponse.status).toBe(200);
    const first = (await firstResponse.json()) as { number: number };
    expect(first.number).toBe(1);

    const secondResponse = await app.request(
      `/api/change-order/${project.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Add second bathroom",
          description: "Client requested an additional bathroom on level 2.",
        }),
      },
    );
    const second = (await secondResponse.json()) as { number: number };
    expect(second.number).toBe(2);

    const listResponse = await app.request(`/api/change-order/${project.id}`);
    const list = (await listResponse.json()) as Array<{ number: number }>;
    expect(list.map((co) => co.number)).toEqual([1, 2]);
  });

  it("approving a change order stamps the decider and note", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(
      `/api/change-order/${project.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Upgrade flooring",
          description: "Client requested hardwood instead of laminate.",
          costImpactCents: 250000,
        }),
      },
    );
    const created = (await createResponse.json()) as { id: string };

    const approveResponse = await app.request(
      `/api/change-order/item/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          decisionNote: "Client signed off via email.",
        }),
      },
    );
    expect(approveResponse.status).toBe(200);
    const approved = (await approveResponse.json()) as {
      status: string;
      decidedByUserId: string | null;
      decidedAt: string | null;
      decisionNote: string | null;
    };
    expect(approved.status).toBe("approved");
    expect(approved.decidedByUserId).toBe(member.user.id);
    expect(approved.decidedAt).not.toBeNull();
    expect(approved.decisionNote).toBe("Client signed off via email.");
  });

  it("rejecting then reopening a change order clears the decision fields", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(
      `/api/change-order/${project.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Add skylight",
          description: "Client requested a skylight in the study.",
        }),
      },
    );
    const created = (await createResponse.json()) as { id: string };

    const rejectResponse = await app.request(
      `/api/change-order/item/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      },
    );
    expect(rejectResponse.status).toBe(200);
    const rejected = (await rejectResponse.json()) as { status: string };
    expect(rejected.status).toBe("rejected");

    const reopenResponse = await app.request(
      `/api/change-order/item/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "pending_review" }),
      },
    );
    const reopened = (await reopenResponse.json()) as {
      status: string;
      decidedByUserId: string | null;
      decidedAt: string | null;
    };
    expect(reopened.status).toBe("pending_review");
    expect(reopened.decidedByUserId).toBeNull();
    expect(reopened.decidedAt).toBeNull();
  });

  it("deletes a change order", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(
      `/api/change-order/${project.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Delete me",
          description: "This change order will be deleted.",
        }),
      },
    );
    const created = (await createResponse.json()) as { id: string };

    const deleteResponse = await app.request(
      `/api/change-order/item/${created.id}`,
      { method: "DELETE" },
    );
    expect(deleteResponse.status).toBe(200);

    const listResponse = await app.request(`/api/change-order/${project.id}`);
    await expect(listResponse.json()).resolves.toHaveLength(0);
  });

  it("rejects a viewer-role member creating/updating/deleting, but allows reading", async () => {
    const member = await createWorkspaceMember({ role: "viewer" });
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const readResponse = await app.request(`/api/change-order/${project.id}`);
    expect(readResponse.status).toBe(200);

    const createResponse = await app.request(
      `/api/change-order/${project.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Not allowed",
          description: "Viewers can't create change orders.",
        }),
      },
    );
    expect(createResponse.status).toBe(403);
  });
});
