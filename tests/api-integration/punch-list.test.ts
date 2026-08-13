import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

async function createAssetFixture({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const [asset] = await db
    .insert(schema.assetTable)
    .values({
      workspaceId,
      projectId,
      objectKey: `test/${randomUUID()}.png`,
      filename: "site-photo.png",
      mimeType: "image/png",
      size: 1024,
      kind: "image",
      surface: "description",
    })
    .returning();

  if (!asset) {
    throw new Error("Failed to seed asset fixture");
  }

  return asset;
}

describe("API integration: punch list and project completion", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("blocks project completion while a punch item is open, then allows it once resolved", async () => {
    const member = await createWorkspaceMember({ role: "admin" });
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const asset = await createAssetFixture({
      workspaceId: member.workspace.id,
      projectId: project.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createPinResponse = await app.request(`/api/asset-pin/${asset.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: "Missing outlet cover",
        x: 0.2,
        y: 0.3,
      }),
    });
    expect(createPinResponse.status).toBe(200);
    const pin = (await createPinResponse.json()) as { id: string };

    const markPunchResponse = await app.request(
      `/api/asset-pin/pin/${pin.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          isPunchItem: true,
          assigneeUserId: member.user.id,
          dueDate: "2026-12-01T00:00:00.000Z",
        }),
      },
    );
    expect(markPunchResponse.status).toBe(200);
    const punchPin = (await markPunchResponse.json()) as {
      isPunchItem: boolean;
      assignee: { id: string; name: string | null } | null;
      dueDate: string | null;
    };
    expect(punchPin.isPunchItem).toBe(true);
    expect(punchPin.assignee?.id).toBe(member.user.id);
    expect(punchPin.dueDate).toBeTruthy();

    const summaryBeforeResolve = await app.request(
      `/api/project/${project.id}/punch-summary`,
    );
    expect(summaryBeforeResolve.status).toBe(200);
    await expect(summaryBeforeResolve.json()).resolves.toEqual({
      openCount: 1,
    });

    const blockedCompleteResponse = await app.request(
      `/api/project/${project.id}/complete`,
      { method: "PUT" },
    );
    expect(blockedCompleteResponse.status).toBe(409);

    const resolveResponse = await app.request(`/api/asset-pin/pin/${pin.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    expect(resolveResponse.status).toBe(200);

    const summaryAfterResolve = await app.request(
      `/api/project/${project.id}/punch-summary`,
    );
    await expect(summaryAfterResolve.json()).resolves.toEqual({
      openCount: 0,
    });

    const completeResponse = await app.request(
      `/api/project/${project.id}/complete`,
      { method: "PUT" },
    );
    expect(completeResponse.status).toBe(200);
    const completedProject = (await completeResponse.json()) as {
      completedAt: string | null;
    };
    expect(completedProject.completedAt).toBeTruthy();

    const uncompleteResponse = await app.request(
      `/api/project/${project.id}/uncomplete`,
      { method: "PUT" },
    );
    expect(uncompleteResponse.status).toBe(200);
    const uncompletedProject = (await uncompleteResponse.json()) as {
      completedAt: string | null;
    };
    expect(uncompletedProject.completedAt).toBeNull();
  });

  it("allows completing a project with no punch items", async () => {
    const member = await createWorkspaceMember({ role: "admin" });
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const completeResponse = await app.request(
      `/api/project/${project.id}/complete`,
      { method: "PUT" },
    );
    expect(completeResponse.status).toBe(200);
  });
});
