import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockProjectFindFirst = vi.fn();

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    query: {
      projectTable: {
        findFirst: (...args: unknown[]) => mockProjectFindFirst(...args),
      },
    },
  },
}));

import { resolvePublicProject } from "../../../apps/api/src/utils/resolve-public-project";

describe("resolvePublicProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the project when the token resolves, is public, and unexpired", async () => {
    mockProjectFindFirst.mockResolvedValue({
      id: "proj-1",
      isPublic: true,
      publicLinkExpiresAt: null,
    });

    const project = await resolvePublicProject("token-1");

    expect(project.id).toBe("proj-1");
  });

  it("returns the project when the expiry is in the future", async () => {
    const future = new Date(Date.now() + 60_000);
    mockProjectFindFirst.mockResolvedValue({
      id: "proj-1",
      isPublic: true,
      publicLinkExpiresAt: future,
    });

    const project = await resolvePublicProject("token-1");

    expect(project.id).toBe("proj-1");
  });

  it("throws 404 when no project matches the token", async () => {
    mockProjectFindFirst.mockResolvedValue(undefined);

    await expect(resolvePublicProject("missing-token")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("throws 403 when the project is not public", async () => {
    mockProjectFindFirst.mockResolvedValue({
      id: "proj-1",
      isPublic: false,
      publicLinkExpiresAt: null,
    });

    await expect(resolvePublicProject("token-1")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("throws 410 when the link has expired", async () => {
    const past = new Date(Date.now() - 60_000);
    mockProjectFindFirst.mockResolvedValue({
      id: "proj-1",
      isPublic: true,
      publicLinkExpiresAt: past,
    });

    await expect(resolvePublicProject("token-1")).rejects.toMatchObject({
      status: 410,
    });
  });
});
