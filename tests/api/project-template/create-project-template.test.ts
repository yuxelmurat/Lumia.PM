import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockInsert = vi.fn();

function createMockTxContext() {
  return {
    insert: (...args: unknown[]) => mockInsert(...args),
  };
}

const mockTransaction = vi.fn(async (cb: (tx: unknown) => unknown) =>
  cb(createMockTxContext()),
);

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import createProjectTemplate from "../../../apps/api/src/project-template/controllers/create-project-template";

function makeInsertMock(returned: unknown) {
  const chain = {
    values: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve([returned])),
  };
  return chain;
}

const COLUMNS = [
  { name: "To Do", slug: "to-do", position: 0, isFinal: false },
  { name: "Done", slug: "done", position: 1, isFinal: true },
];

describe("createProjectTemplate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
      cb(createMockTxContext()),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects a template with no columns", async () => {
    await expect(
      createProjectTemplate("ws-1", "Sprint", undefined, undefined, []),
    ).rejects.toMatchObject({ status: 400 });

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects a task whose columnSlug doesn't match any column", async () => {
    await expect(
      createProjectTemplate("ws-1", "Sprint", undefined, undefined, COLUMNS, [
        { title: "Kickoff", columnSlug: "not-a-real-column", position: 0 },
      ]),
    ).rejects.toMatchObject({ status: 400 });

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("creates a template with its columns and tasks in one transaction", async () => {
    const template = {
      id: "tmpl-1",
      workspaceId: "ws-1",
      name: "Client Onboarding",
      description: null,
      icon: "Layout",
    };
    mockInsert.mockReturnValue(makeInsertMock(template));

    const result = await createProjectTemplate(
      "ws-1",
      "Client Onboarding",
      undefined,
      undefined,
      COLUMNS,
      [{ title: "Kickoff call", columnSlug: "to-do", position: 0 }],
    );

    expect(result).toEqual(template);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // One insert for the template row, one for columns, one for tasks.
    expect(mockInsert).toHaveBeenCalledTimes(3);
  });
});
