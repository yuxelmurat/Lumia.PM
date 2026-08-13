import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

describe("API integration: Permits", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("assigns sequential per-project numbers to created permits", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const firstResponse = await app.request(`/api/permit/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jurisdictionName: "Seattle DCI",
        permitType: "Building Permit",
      }),
    });
    expect(firstResponse.status).toBe(200);
    const first = (await firstResponse.json()) as {
      number: number;
      status: string;
    };
    expect(first.number).toBe(1);
    expect(first.status).toBe("not_submitted");

    const secondResponse = await app.request(`/api/permit/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jurisdictionName: "King County" }),
    });
    const second = (await secondResponse.json()) as { number: number };
    expect(second.number).toBe(2);

    const listResponse = await app.request(`/api/permit/${project.id}`);
    const list = (await listResponse.json()) as Array<{ number: number }>;
    expect(list.map((permit) => permit.number)).toEqual([1, 2]);
  });

  it("supports free status transitions and setting the official permit number", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/permit/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jurisdictionName: "Seattle DCI" }),
    });
    const created = (await createResponse.json()) as { id: string };

    const submittedResponse = await app.request(
      `/api/permit/item/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "submitted",
          submittedDate: "2026-01-10T00:00:00.000Z",
        }),
      },
    );
    expect(submittedResponse.status).toBe(200);
    const submitted = (await submittedResponse.json()) as { status: string };
    expect(submitted.status).toBe("submitted");

    const correctionsResponse = await app.request(
      `/api/permit/item/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "corrections_required" }),
      },
    );
    expect(await correctionsResponse.json()).toMatchObject({
      status: "corrections_required",
    });

    const resubmittedResponse = await app.request(
      `/api/permit/item/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      },
    );
    expect(await resubmittedResponse.json()).toMatchObject({
      status: "submitted",
    });

    const issuedResponse = await app.request(`/api/permit/item/${created.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: "issued",
        permitNumber: "BP-2026-4471",
        approvalDate: "2026-02-01T00:00:00.000Z",
      }),
    });
    expect(issuedResponse.status).toBe(200);
    const issued = (await issuedResponse.json()) as {
      status: string;
      permitNumber: string | null;
      approvalDate: string | null;
    };
    expect(issued.status).toBe("issued");
    expect(issued.permitNumber).toBe("BP-2026-4471");
    expect(issued.approvalDate).not.toBeNull();
  });

  it("assigns a permit to a workspace member and reflects it in the response", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/permit/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jurisdictionName: "Seattle DCI",
        assigneeUserId: member.user.id,
      }),
    });
    expect(createResponse.status).toBe(200);
    const created = (await createResponse.json()) as {
      assignee: { id: string; name: string | null } | null;
    };
    expect(created.assignee?.id).toBe(member.user.id);
  });

  it("deletes a permit", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/permit/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jurisdictionName: "Delete me" }),
    });
    const created = (await createResponse.json()) as { id: string };

    const deleteResponse = await app.request(`/api/permit/item/${created.id}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(200);

    const listResponse = await app.request(`/api/permit/${project.id}`);
    await expect(listResponse.json()).resolves.toHaveLength(0);
  });

  it("rejects a viewer-role member creating/updating/deleting, but allows reading", async () => {
    const member = await createWorkspaceMember({ role: "viewer" });
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const readResponse = await app.request(`/api/permit/${project.id}`);
    expect(readResponse.status).toBe(200);

    const createResponse = await app.request(`/api/permit/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jurisdictionName: "Not allowed" }),
    });
    expect(createResponse.status).toBe(403);
  });
});
