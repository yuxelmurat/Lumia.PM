import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockExecute = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockFindFirstTemplate = vi.fn();
const mockUpdate = vi.fn();

function makeSelectMock(rows: unknown[]) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => Promise.resolve(rows)),
  };
  return chain;
}

function makeInsertMock(returned: unknown) {
  const chain = {
    values: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve(returned ? [returned] : [])),
  };
  return chain;
}

function makeUpdateMock(returned: unknown) {
  const chain = {
    set: vi.fn(() => chain),
    where: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve([returned])),
  };
  return chain;
}

function createMockTxContext() {
  return {
    execute: (...args: unknown[]) => mockExecute(...args),
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    query: {
      projectTemplateTable: {
        findFirst: (...args: unknown[]) => mockFindFirstTemplate(...args),
      },
    },
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

import createProject from "../../../apps/api/src/project/controllers/create-project";

const CREATED_PROJECT = {
  id: "proj-1",
  workspaceId: "ws-1",
  name: "New Client",
  icon: "Layout",
  slug: "new-client",
  position: 0,
};

const TEMPLATE = {
  id: "tmpl-1",
  workspaceId: "ws-1",
  name: "Client Onboarding",
  columns: [
    {
      id: "tc-1",
      name: "To Do",
      slug: "to-do",
      position: 0,
      isFinal: false,
      icon: null,
      color: null,
    },
    {
      id: "tc-2",
      name: "Done",
      slug: "done",
      position: 1,
      isFinal: true,
      icon: null,
      color: null,
    },
  ],
  tasks: [
    {
      id: "tt-1",
      title: "Kickoff call",
      description: null,
      columnSlug: "to-do",
      position: 0,
    },
    {
      id: "tt-2",
      title: "Send contract",
      description: "Send the signed contract",
      columnSlug: "to-do",
      position: 1,
    },
  ],
};

describe("createProject with templateId", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
      cb(createMockTxContext()),
    );
    mockExecute.mockResolvedValue(undefined);
    mockSelect.mockReturnValue(makeSelectMock([{ maxPosition: null }]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws a 404 when templateId doesn't resolve in the workspace", async () => {
    mockFindFirstTemplate.mockResolvedValue(undefined);

    await expect(
      createProject("ws-1", "New Client", "Layout", "new-client", "bogus-id"),
    ).rejects.toMatchObject({ status: 404 });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("seeds columns and tasks from the template, assigning incrementing task numbers", async () => {
    mockFindFirstTemplate.mockResolvedValue(TEMPLATE);

    const insertedColumns = TEMPLATE.columns.map((col) => ({
      id: `col-${col.slug}`,
      projectId: CREATED_PROJECT.id,
      slug: col.slug,
    }));

    const insertChains: ReturnType<typeof makeInsertMock>[] = [];
    let insertCallIndex = 0;
    mockInsert.mockImplementation(() => {
      let chain: ReturnType<typeof makeInsertMock>;
      if (insertCallIndex === 0) {
        chain = makeInsertMock(CREATED_PROJECT);
      } else if (insertCallIndex - 1 < TEMPLATE.columns.length) {
        chain = makeInsertMock(insertedColumns[insertCallIndex - 1]);
      } else {
        // Task inserts don't call .returning() in the controller.
        chain = makeInsertMock(undefined);
      }
      insertCallIndex += 1;
      insertChains.push(chain);
      return chain;
    });

    // claimTaskNumbers issues its own db.update on the projectTable.
    mockUpdate.mockReturnValue(makeUpdateMock({ lastTaskNumber: 2 }));

    const result = await createProject(
      "ws-1",
      "New Client",
      "Layout",
      "new-client",
      "tmpl-1",
    );

    expect(result).toEqual(CREATED_PROJECT);
    // 1 project insert + 2 column inserts + 2 task inserts.
    expect(mockInsert).toHaveBeenCalledTimes(5);
    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const taskInsertChains = insertChains.slice(3);
    expect(taskInsertChains).toHaveLength(2);
    expect(taskInsertChains[0]?.values).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Kickoff call",
        number: 1,
        columnId: "col-to-do",
        status: "to-do",
      }),
    );
    expect(taskInsertChains[1]?.values).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Send contract",
        number: 2,
        columnId: "col-to-do",
        status: "to-do",
      }),
    );
  });
});
