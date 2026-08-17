import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import { mockAnonymousSession, mockAuthenticatedSession } from "./helpers/auth";
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
      filename: "concept-render.png",
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

describe("API integration: asset approval", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("lets a team member send for approval and a guest approve it", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const asset = await createAssetFixture({
      workspaceId: member.workspace.id,
      projectId: project.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const requestResponse = await app.request(
      `/api/asset-approval/${asset.id}`,
      { method: "POST" },
    );
    expect(requestResponse.status).toBe(200);
    const afterRequest = (await requestResponse.json()) as Array<{
      status: string;
      actor: { type: string };
    }>;
    expect(afterRequest).toHaveLength(1);
    expect(afterRequest[0]).toMatchObject({
      status: "pending",
      actor: { type: "user" },
    });

    const [assetAfterRequest] = await db
      .select({ approvalStatus: schema.assetTable.approvalStatus })
      .from(schema.assetTable)
      .where(eq(schema.assetTable.id, asset.id));
    expect(assetAfterRequest?.approvalStatus).toBe("pending");

    const shareLinkResponse = await app.request(
      `/api/asset-share/${asset.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      },
    );
    const shareLink = (await shareLinkResponse.json()) as { token: string };

    mockAnonymousSession();

    const publicAssetResponse = await app.request(
      `/api/public-asset/${shareLink.token}`,
    );
    const publicAsset = (await publicAssetResponse.json()) as {
      asset: { approvalStatus: string | null };
    };
    expect(publicAsset.asset.approvalStatus).toBe("pending");

    const guestResponse = await app.request(
      `/api/public-asset/${shareLink.token}/guest`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Jane Client",
          email: "jane@example.com",
        }),
      },
    );
    const { guestId } = (await guestResponse.json()) as { guestId: string };

    const decisionResponse = await app.request(
      `/api/public-asset/${shareLink.token}/approval`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guestId, decision: "approved" }),
      },
    );
    expect(decisionResponse.status).toBe(200);
    const afterDecision = (await decisionResponse.json()) as Array<{
      status: string;
      actor: { type: string; name: string | null };
    }>;
    expect(afterDecision).toHaveLength(2);
    expect(afterDecision[1]).toMatchObject({
      status: "approved",
      actor: { type: "guest", name: "Jane Client" },
    });

    mockAuthenticatedSession(member.user);
    const historyResponse = await app.request(
      `/api/asset-approval/${asset.id}`,
    );
    await expect(historyResponse.json()).resolves.toHaveLength(2);
  });

  it("lets a guest request changes with a note", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const asset = await createAssetFixture({
      workspaceId: member.workspace.id,
      projectId: project.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    await app.request(`/api/asset-approval/${asset.id}`, { method: "POST" });
    const shareLinkResponse = await app.request(
      `/api/asset-share/${asset.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      },
    );
    const shareLink = (await shareLinkResponse.json()) as { token: string };

    mockAnonymousSession();
    const guestResponse = await app.request(
      `/api/public-asset/${shareLink.token}/guest`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Jane Client",
          email: "jane@example.com",
        }),
      },
    );
    const { guestId } = (await guestResponse.json()) as { guestId: string };

    const decisionResponse = await app.request(
      `/api/public-asset/${shareLink.token}/approval`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestId,
          decision: "changes_requested",
          note: "Please make the sofa green",
        }),
      },
    );
    expect(decisionResponse.status).toBe(200);
    const events = (await decisionResponse.json()) as Array<{
      status: string;
      note: string | null;
    }>;
    expect(events[1]).toMatchObject({
      status: "changes_requested",
      note: "Please make the sofa green",
    });
  });

  it("rejects a guest decision when the asset is not pending approval", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const asset = await createAssetFixture({
      workspaceId: member.workspace.id,
      projectId: project.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    // Never sent for approval — approvalStatus stays null.
    const shareLinkResponse = await app.request(
      `/api/asset-share/${asset.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      },
    );
    const shareLink = (await shareLinkResponse.json()) as { token: string };

    mockAnonymousSession();
    const guestResponse = await app.request(
      `/api/public-asset/${shareLink.token}/guest`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Jane Client",
          email: "jane@example.com",
        }),
      },
    );
    const { guestId } = (await guestResponse.json()) as { guestId: string };

    const decisionResponse = await app.request(
      `/api/public-asset/${shareLink.token}/approval`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guestId, decision: "approved" }),
      },
    );
    expect(decisionResponse.status).toBe(400);
  });

  it("rejects a viewer-role member requesting approval, but allows reading", async () => {
    const member = await createWorkspaceMember({ role: "viewer" });
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const asset = await createAssetFixture({
      workspaceId: member.workspace.id,
      projectId: project.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const readResponse = await app.request(`/api/asset-approval/${asset.id}`);
    expect(readResponse.status).toBe(200);

    const writeResponse = await app.request(`/api/asset-approval/${asset.id}`, {
      method: "POST",
    });
    expect(writeResponse.status).toBe(403);
  });
});
