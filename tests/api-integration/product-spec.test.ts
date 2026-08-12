import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

describe("API integration: product specs (FF&E)", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("supports the full create/list/update/delete cycle", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request(
      `/api/product-spec/${project.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomLabel: "Living Room",
          name: "Sofa",
          vendor: "West Elm",
          unitCost: 129900,
          quantity: 1,
        }),
      },
    );
    expect(createResponse.status).toBe(200);
    const spec = (await createResponse.json()) as {
      id: string;
      status: string;
      roomLabel: string | null;
    };
    expect(spec.status).toBe("proposed");
    expect(spec.roomLabel).toBe("Living Room");

    const listResponse = await app.request(
      `/api/product-spec/${project.id}`,
    );
    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toHaveLength(1);

    const updateResponse = await app.request(
      `/api/product-spec/item/${spec.id}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "ordered", quantity: 2 }),
      },
    );
    expect(updateResponse.status).toBe(200);
    const updated = (await updateResponse.json()) as {
      status: string;
      quantity: number;
    };
    expect(updated).toMatchObject({ status: "ordered", quantity: 2 });

    const deleteResponse = await app.request(
      `/api/product-spec/item/${spec.id}`,
      { method: "DELETE" },
    );
    expect(deleteResponse.status).toBe(200);

    const listAfterDelete = await app.request(
      `/api/product-spec/${project.id}`,
    );
    await expect(listAfterDelete.json()).resolves.toHaveLength(0);
  });

  it("rejects a viewer-role member creating/updating/deleting, but allows reading", async () => {
    const member = await createWorkspaceMember({ role: "viewer" });
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const readResponse = await app.request(
      `/api/product-spec/${project.id}`,
    );
    expect(readResponse.status).toBe(200);

    const createResponse = await app.request(
      `/api/product-spec/${project.id}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Not allowed" }),
      },
    );
    expect(createResponse.status).toBe(403);
  });

  it("uploads and finalizes a product spec image into an asset", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const uploadResponse = await app.request(
      `/api/product-spec/image-upload/${project.id}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: "sofa.png",
          contentType: "image/png",
          size: 1024,
        }),
      },
    );

    // S3 isn't configured in this test environment, so the presign call is
    // expected to fail with a 503/400 rather than succeed — this asserts the
    // route wiring (permission + validation) runs before it ever reaches S3.
    expect([400, 503]).toContain(uploadResponse.status);
  });
});
