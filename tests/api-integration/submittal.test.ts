import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

describe("API integration: Submittals", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("assigns sequential per-project numbers to created submittals", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const firstResponse = await app.request(`/api/submittal/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Kitchen cabinet shop drawings",
        description: "Shop drawings for the kitchen cabinetry.",
      }),
    });
    expect(firstResponse.status).toBe(200);
    const first = (await firstResponse.json()) as { number: number };
    expect(first.number).toBe(1);

    const secondResponse = await app.request(`/api/submittal/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Tile sample submittal",
        description: "Sample board for bathroom tile.",
      }),
    });
    const second = (await secondResponse.json()) as { number: number };
    expect(second.number).toBe(2);

    const listResponse = await app.request(`/api/submittal/${project.id}`);
    const list = (await listResponse.json()) as Array<{ number: number }>;
    expect(list.map((submittal) => submittal.number)).toEqual([1, 2]);
  });

  it("approving a submittal stamps the reviewer", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/submittal/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Countertop material",
        description: "Quartz countertop material submittal.",
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    const approveResponse = await app.request(
      `/api/submittal/item/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved", reviewNote: "Looks good." }),
      },
    );
    expect(approveResponse.status).toBe(200);
    const approved = (await approveResponse.json()) as {
      status: string;
      reviewedByUserId: string | null;
      reviewedAt: string | null;
      reviewNote: string | null;
    };
    expect(approved.status).toBe("approved");
    expect(approved.reviewedByUserId).toBe(member.user.id);
    expect(approved.reviewedAt).not.toBeNull();
    expect(approved.reviewNote).toBe("Looks good.");
  });

  it("supports revise & resubmit chained via supersedesSubmittalId, then approves the resubmission", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/submittal/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Lighting fixture cut sheet",
        specSection: "26 51 00",
        description: "Pendant lighting cut sheet for review.",
      }),
    });
    const original = (await createResponse.json()) as {
      id: string;
      number: number;
    };

    const reviseResponse = await app.request(
      `/api/submittal/item/${original.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "revise_resubmit",
          reviewNote: "Wrong finish specified.",
        }),
      },
    );
    expect(reviseResponse.status).toBe(200);
    const revised = (await reviseResponse.json()) as {
      status: string;
      reviewedByUserId: string | null;
    };
    expect(revised.status).toBe("revise_resubmit");
    expect(revised.reviewedByUserId).toBe(member.user.id);

    const resubmitResponse = await app.request(`/api/submittal/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Lighting fixture cut sheet",
        specSection: "26 51 00",
        description: "Resubmitted with correct finish.",
        supersedesSubmittalId: original.id,
      }),
    });
    expect(resubmitResponse.status).toBe(200);
    const resubmitted = (await resubmitResponse.json()) as {
      id: string;
      number: number;
      supersedesSubmittalId: string | null;
      supersedesSubmittalNumber: number | null;
    };
    expect(resubmitted.number).toBe(2);
    expect(resubmitted.supersedesSubmittalId).toBe(original.id);
    expect(resubmitted.supersedesSubmittalNumber).toBe(original.number);

    const approveResponse = await app.request(
      `/api/submittal/item/${resubmitted.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      },
    );
    const approved = (await approveResponse.json()) as { status: string };
    expect(approved.status).toBe("approved");
  });

  it("reverting status to open clears reviewer stamps", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/submittal/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Flooring sample",
        description: "Engineered wood flooring sample.",
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    await app.request(`/api/submittal/item/${created.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });

    const reopenResponse = await app.request(
      `/api/submittal/item/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      },
    );
    expect(reopenResponse.status).toBe(200);
    const reopened = (await reopenResponse.json()) as {
      status: string;
      reviewedByUserId: string | null;
      reviewedAt: string | null;
    };
    expect(reopened.status).toBe("open");
    expect(reopened.reviewedByUserId).toBeNull();
    expect(reopened.reviewedAt).toBeNull();
  });

  it("rejects a supersedesSubmittalId that belongs to a different project", async () => {
    const member = await createWorkspaceMember();
    const { project: projectA } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const { project: projectB } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/submittal/${projectA.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Project A submittal",
        description: "Belongs to project A.",
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    const crossProjectResponse = await app.request(
      `/api/submittal/${projectB.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Cross-project resubmit",
          description: "Should be rejected.",
          supersedesSubmittalId: created.id,
        }),
      },
    );

    expect(crossProjectResponse.status).toBe(400);
    const text = await crossProjectResponse.text();
    expect(text).toBe("supersedesSubmittalId must belong to the same project.");
  });

  it("deletes a submittal", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/submittal/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Delete me",
        description: "This submittal will be deleted.",
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    const deleteResponse = await app.request(
      `/api/submittal/item/${created.id}`,
      { method: "DELETE" },
    );
    expect(deleteResponse.status).toBe(200);

    const listResponse = await app.request(`/api/submittal/${project.id}`);
    await expect(listResponse.json()).resolves.toHaveLength(0);
  });

  it("rejects a viewer-role member creating/updating/deleting, but allows reading", async () => {
    const member = await createWorkspaceMember({ role: "viewer" });
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const readResponse = await app.request(`/api/submittal/${project.id}`);
    expect(readResponse.status).toBe(200);

    const createResponse = await app.request(`/api/submittal/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Not allowed",
        description: "Viewers can't create submittals.",
      }),
    });
    expect(createResponse.status).toBe(403);
  });
});
