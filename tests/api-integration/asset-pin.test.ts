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
      filename: "render.png",
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

describe("API integration: asset pins", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("lets a workspace member create a pin and reply, and resolve it", async () => {
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

    const createResponse = await app.request(`/api/asset-pin/${asset.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: "Make this sofa green",
        x: 0.42,
        y: 0.61,
      }),
    });
    expect(createResponse.status).toBe(200);
    const pin = (await createResponse.json()) as {
      id: string;
      status: string;
      notes: Array<{ content: string }>;
    };
    expect(pin.status).toBe("open");
    expect(pin.notes).toHaveLength(1);
    expect(pin.notes[0]?.content).toBe("Make this sofa green");

    const listResponse = await app.request(`/api/asset-pin/${asset.id}`);
    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toHaveLength(1);

    const replyResponse = await app.request(
      `/api/asset-pin/pin/${pin.id}/notes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "On it" }),
      },
    );
    expect(replyResponse.status).toBe(200);
    const afterReply = (await replyResponse.json()) as {
      notes: Array<{ content: string }>;
    };
    expect(afterReply.notes).toHaveLength(2);

    const resolveResponse = await app.request(`/api/asset-pin/pin/${pin.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    expect(resolveResponse.status).toBe(200);
    const resolved = (await resolveResponse.json()) as { status: string };
    expect(resolved.status).toBe("resolved");
  });

  it("rejects a viewer-role member creating a pin, but allows reading", async () => {
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

    const readResponse = await app.request(`/api/asset-pin/${asset.id}`);
    expect(readResponse.status).toBe(200);

    const writeResponse = await app.request(`/api/asset-pin/${asset.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "Not allowed", x: 0.5, y: 0.5 }),
    });
    expect(writeResponse.status).toBe(403);
  });

  it("lets a share-link guest view and annotate an asset without an account", async () => {
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

    const shareLinkResponse = await app.request(
      `/api/asset-share/${asset.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      },
    );
    expect(shareLinkResponse.status).toBe(200);
    const shareLink = (await shareLinkResponse.json()) as {
      id: string;
      token: string;
    };

    mockAnonymousSession();

    const publicAssetResponse = await app.request(
      `/api/public-asset/${shareLink.token}`,
    );
    expect(publicAssetResponse.status).toBe(200);
    const publicAsset = (await publicAssetResponse.json()) as {
      asset: { id: string };
      pins: unknown[];
    };
    expect(publicAsset.asset.id).toBe(asset.id);
    expect(publicAsset.pins).toHaveLength(0);

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
    expect(guestResponse.status).toBe(200);
    const { guestId } = (await guestResponse.json()) as { guestId: string };
    expect(guestId).toBeTruthy();

    const guestPinResponse = await app.request(
      `/api/public-asset/${shareLink.token}/pins`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestId,
          content: "Make the sofa green",
          x: 0.3,
          y: 0.7,
        }),
      },
    );
    expect(guestPinResponse.status).toBe(200);
    const guestPin = (await guestPinResponse.json()) as {
      id: string;
      author: { type: string; name: string | null };
    };
    expect(guestPin.author).toEqual({
      type: "guest",
      id: expect.any(String),
      name: "Jane Client",
    });

    // The team sees the guest's pin through the normal authenticated route.
    mockAuthenticatedSession(member.user);
    const teamListResponse = await app.request(`/api/asset-pin/${asset.id}`);
    expect(teamListResponse.status).toBe(200);
    await expect(teamListResponse.json()).resolves.toHaveLength(1);

    // Revoking the link immediately blocks further guest access.
    const revokeResponse = await app.request(
      `/api/asset-share/${shareLink.id}`,
      { method: "DELETE" },
    );
    expect(revokeResponse.status).toBe(200);

    mockAnonymousSession();
    const afterRevoke = await app.request(
      `/api/public-asset/${shareLink.token}`,
    );
    expect(afterRevoke.status).toBe(404);
  });

  it("rejects a guest from posting to a pin using another share link's guest id", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const assetA = await createAssetFixture({
      workspaceId: member.workspace.id,
      projectId: project.id,
    });
    const assetB = await createAssetFixture({
      workspaceId: member.workspace.id,
      projectId: project.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const linkAResponse = await app.request(`/api/asset-share/${assetA.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const linkA = (await linkAResponse.json()) as { token: string };

    const linkBResponse = await app.request(`/api/asset-share/${assetB.id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const linkB = (await linkBResponse.json()) as { token: string };

    mockAnonymousSession();

    const guestAResponse = await app.request(
      `/api/public-asset/${linkA.token}/guest`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Guest A", email: "a@example.com" }),
      },
    );
    const { guestId: guestAId } = (await guestAResponse.json()) as {
      guestId: string;
    };

    const crossLinkPinResponse = await app.request(
      `/api/public-asset/${linkB.token}/pins`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guestId: guestAId,
          content: "Trying to annotate the wrong asset",
          x: 0.1,
          y: 0.1,
        }),
      },
    );
    expect(crossLinkPinResponse.status).toBe(403);

    const pinsOnAssetB = await db
      .select()
      .from(schema.assetPinTable)
      .where(eq(schema.assetPinTable.assetId, assetB.id));
    expect(pinsOnAssetB).toHaveLength(0);
  });
});
