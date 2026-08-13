import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

describe("API integration: RFIs (requests for information)", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("assigns sequential per-project numbers to created RFIs", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const firstResponse = await app.request(`/api/rfi/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject: "Ceiling height clarification",
        question: "What is the finished ceiling height in the lobby?",
      }),
    });
    expect(firstResponse.status).toBe(200);
    const first = (await firstResponse.json()) as { number: number };
    expect(first.number).toBe(1);

    const secondResponse = await app.request(`/api/rfi/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject: "Door hardware finish",
        question: "Confirm the finish for door hardware on level 2.",
      }),
    });
    const second = (await secondResponse.json()) as { number: number };
    expect(second.number).toBe(2);

    const listResponse = await app.request(`/api/rfi/${project.id}`);
    const list = (await listResponse.json()) as Array<{ number: number }>;
    expect(list.map((rfi) => rfi.number)).toEqual([1, 2]);
  });

  it("answering an RFI transitions it to answered and stamps the answerer", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/rfi/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject: "Foundation waterproofing",
        question: "Which waterproofing membrane should be used?",
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    const answerResponse = await app.request(`/api/rfi/item/${created.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        answer: "Use a bituminous membrane, spec 07 13 26.",
      }),
    });
    expect(answerResponse.status).toBe(200);
    const answered = (await answerResponse.json()) as {
      status: string;
      answer: string | null;
      answeredByUserId: string | null;
      answeredAt: string | null;
    };
    expect(answered.status).toBe("answered");
    expect(answered.answer).toBe("Use a bituminous membrane, spec 07 13 26.");
    expect(answered.answeredByUserId).toBe(member.user.id);
    expect(answered.answeredAt).not.toBeNull();
  });

  it("supports closing and reopening an RFI", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/rfi/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject: "Paint color approval",
        question: "Confirm the exterior paint color.",
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    const closeResponse = await app.request(`/api/rfi/item/${created.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    expect(closeResponse.status).toBe(200);
    const closed = (await closeResponse.json()) as { status: string };
    expect(closed.status).toBe("closed");

    const reopenResponse = await app.request(`/api/rfi/item/${created.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "open" }),
    });
    const reopened = (await reopenResponse.json()) as {
      status: string;
      answeredByUserId: string | null;
      answeredAt: string | null;
    };
    expect(reopened.status).toBe("open");
    expect(reopened.answeredByUserId).toBeNull();
    expect(reopened.answeredAt).toBeNull();
  });

  it("assigns an RFI to a workspace member and reflects it in the response", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/rfi/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject: "Structural steel spec",
        question: "Confirm the grade of structural steel for the beams.",
        assigneeUserId: member.user.id,
        dueDate: "2026-09-01T00:00:00.000Z",
      }),
    });
    expect(createResponse.status).toBe(200);
    const created = (await createResponse.json()) as {
      assignee: { id: string; name: string | null } | null;
      dueDate: string | null;
    };
    expect(created.assignee?.id).toBe(member.user.id);
    expect(created.dueDate).not.toBeNull();
  });

  it("deletes an RFI", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(`/api/rfi/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject: "Delete me",
        question: "This RFI will be deleted.",
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    const deleteResponse = await app.request(`/api/rfi/item/${created.id}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(200);

    const listResponse = await app.request(`/api/rfi/${project.id}`);
    await expect(listResponse.json()).resolves.toHaveLength(0);
  });

  it("rejects a viewer-role member creating/updating/deleting, but allows reading", async () => {
    const member = await createWorkspaceMember({ role: "viewer" });
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const readResponse = await app.request(`/api/rfi/${project.id}`);
    expect(readResponse.status).toBe(200);

    const createResponse = await app.request(`/api/rfi/${project.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subject: "Not allowed",
        question: "Viewers can't create RFIs.",
      }),
    });
    expect(createResponse.status).toBe(403);
  });
});
