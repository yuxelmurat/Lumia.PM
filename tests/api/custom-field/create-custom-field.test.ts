import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockInsert = vi.fn();

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

import createCustomField from "../../../apps/api/src/custom-field/controllers/create-custom-field";

function makeInsertMock(returned: unknown) {
  const chain = {
    values: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve([returned])),
  };
  return chain;
}

describe("createCustomField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws a 400 HTTPException for an invalid type", async () => {
    await expect(
      createCustomField("ws-1", "Priority", "invalid-type"),
    ).rejects.toMatchObject({ status: 400 });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("throws a 400 HTTPException for a select field with no options", async () => {
    await expect(
      createCustomField("ws-1", "Category", "select", []),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      createCustomField("ws-1", "Category", "select", undefined),
    ).rejects.toMatchObject({ status: 400 });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("creates a select field when options are provided", async () => {
    const inserted = {
      id: "field-1",
      workspaceId: "ws-1",
      name: "Category",
      type: "select",
      options: ["Bug", "Feature"],
      isRequired: false,
      position: 0,
    };
    mockInsert.mockReturnValue(makeInsertMock(inserted));

    const result = await createCustomField("ws-1", "Category", "select", [
      "Bug",
      "Feature",
    ]);

    expect(result).toEqual(inserted);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("creates a non-select field and ignores stray options", async () => {
    const inserted = {
      id: "field-2",
      workspaceId: "ws-1",
      name: "Story Points",
      type: "number",
      options: null,
      isRequired: false,
      position: 0,
    };
    const insertMock = makeInsertMock(inserted);
    mockInsert.mockReturnValue(insertMock);

    await createCustomField("ws-1", "Story Points", "number", ["ignored"]);

    expect(insertMock.values).toHaveBeenCalledWith(
      expect.objectContaining({ type: "number", options: null }),
    );
  });
});
