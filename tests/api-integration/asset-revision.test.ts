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

let taskNumberCounter = 0;

async function createTaskFixture({
  projectId,
  userId,
  columnId,
}: {
  projectId: string;
  userId: string;
  columnId: string;
}) {
  taskNumberCounter += 1;
  const [task] = await db
    .insert(schema.taskTable)
    .values({
      projectId,
      userId,
      title: "Revision test task",
      status: "to-do",
      columnId,
      priority: "medium",
      number: taskNumberCounter,
      position: 1,
    })
    .returning();

  if (!task) {
    throw new Error("Failed to seed task fixture");
  }

  return task;
}

async function finalizeAsset({
  app,
  taskId,
  workspaceId,
  projectId,
  filename,
  supersedesAssetId,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: test helper, app type is inferred from createApp()
  app: any;
  taskId: string;
  workspaceId: string;
  projectId: string;
  filename: string;
  supersedesAssetId?: string;
}) {
  const key = `workspace/${workspaceId}/project/${projectId}/task/${taskId}/descriptions/${filename}`;

  const response = await app.request(
    `/api/task/image-upload/${taskId}/finalize`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key,
        filename,
        contentType: "image/png",
        size: 12345,
        surface: "description",
        supersedesAssetId,
      }),
    },
  );

  return response;
}

describe("API integration: asset revision history", () => {
  beforeEach(async () => {
    await resetTestDatabase();
    process.env.S3_ENDPOINT = "https://storage.example.test";
    process.env.S3_BUCKET = "test-bucket";
    process.env.S3_ACCESS_KEY_ID = "test-access-key";
    process.env.S3_SECRET_ACCESS_KEY = "test-secret-key";
    delete process.env.S3_KEY_PREFIX;
  });

  it("links a re-uploaded asset to the one it supersedes and returns the ordered chain", async () => {
    const member = await createWorkspaceMember({ role: "admin" });
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const task = await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.todo.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const firstResponse = await finalizeAsset({
      app,
      taskId: task.id,
      workspaceId: member.workspace.id,
      projectId: project.id,
      filename: "render-v1.png",
    });
    expect(firstResponse.status).toBe(200);
    const first = (await firstResponse.json()) as { id: string };

    const secondResponse = await finalizeAsset({
      app,
      taskId: task.id,
      workspaceId: member.workspace.id,
      projectId: project.id,
      filename: "render-v2.png",
      supersedesAssetId: first.id,
    });
    expect(secondResponse.status).toBe(200);
    const second = (await secondResponse.json()) as { id: string };

    const chainResponse = await app.request(
      `/api/asset-revision/${second.id}/chain`,
    );
    expect(chainResponse.status).toBe(200);
    const chain = (await chainResponse.json()) as Array<{
      id: string;
      filename: string;
      revisionNumber: number;
    }>;

    expect(chain).toHaveLength(2);
    expect(chain[0]?.id).toBe(first.id);
    expect(chain[0]?.filename).toBe("render-v1.png");
    expect(chain[0]?.revisionNumber).toBe(1);
    expect(chain[1]?.id).toBe(second.id);
    expect(chain[1]?.filename).toBe("render-v2.png");
    expect(chain[1]?.revisionNumber).toBe(2);

    const chainFromOldest = await app.request(
      `/api/asset-revision/${first.id}/chain`,
    );
    const chainFromOldestBody = (await chainFromOldest.json()) as Array<{
      id: string;
    }>;
    expect(chainFromOldestBody.map((r) => r.id)).toEqual([first.id, second.id]);
  });

  it("returns a single-element chain for an asset with no revisions", async () => {
    const member = await createWorkspaceMember({ role: "admin" });
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const task = await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.todo.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const response = await finalizeAsset({
      app,
      taskId: task.id,
      workspaceId: member.workspace.id,
      projectId: project.id,
      filename: "solo.png",
    });
    const asset = (await response.json()) as { id: string };

    const chainResponse = await app.request(
      `/api/asset-revision/${asset.id}/chain`,
    );
    const chain = (await chainResponse.json()) as Array<{ id: string }>;
    expect(chain).toHaveLength(1);
    expect(chain[0]?.id).toBe(asset.id);
  });

  it("rejects supersedesAssetId that belongs to a different task", async () => {
    const member = await createWorkspaceMember({ role: "admin" });
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const taskA = await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.todo.id,
    });
    const taskB = await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.todo.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const assetAResponse = await finalizeAsset({
      app,
      taskId: taskA.id,
      workspaceId: member.workspace.id,
      projectId: project.id,
      filename: "task-a.png",
    });
    const assetA = (await assetAResponse.json()) as { id: string };

    const response = await finalizeAsset({
      app,
      taskId: taskB.id,
      workspaceId: member.workspace.id,
      projectId: project.id,
      filename: "task-b.png",
      supersedesAssetId: assetA.id,
    });

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe("supersedesAssetId must belong to the same task.");
  });

  it("rejects unauthorized access to the revision chain", async () => {
    const member = await createWorkspaceMember({ role: "admin" });
    const outsiderId = `user-${randomUUID()}`;
    const [outsider] = await db
      .insert(schema.userTable)
      .values({
        id: outsiderId,
        email: `${outsiderId}@example.com`,
        emailVerified: true,
        name: "Outsider",
      })
      .returning();

    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const task = await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.todo.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const assetResponse = await finalizeAsset({
      app,
      taskId: task.id,
      workspaceId: member.workspace.id,
      projectId: project.id,
      filename: "private.png",
    });
    const asset = (await assetResponse.json()) as { id: string };

    mockAuthenticatedSession(outsider);
    const response = await app.request(`/api/asset-revision/${asset.id}/chain`);
    expect(response.status).toBe(403);
  });
});
