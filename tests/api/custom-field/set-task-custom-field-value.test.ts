import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

const mockFindFirst = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockPublishEvent = vi.fn();

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    query: {
      customFieldDefinitionTable: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

vi.mock("../../../apps/api/src/events", () => ({
  publishEvent: (...args: unknown[]) => mockPublishEvent(...args),
}));

import setTaskCustomFieldValue from "../../../apps/api/src/custom-field/controllers/set-task-custom-field-value";

const NUMBER_FIELD = {
  id: "field-1",
  workspaceId: "ws-1",
  name: "Story Points",
  type: "number",
  options: null,
  isRequired: false,
  position: 0,
};

const CHECKBOX_FIELD = {
  ...NUMBER_FIELD,
  id: "field-2",
  name: "Blocked",
  type: "checkbox",
};

const SELECT_FIELD = {
  ...NUMBER_FIELD,
  id: "field-3",
  name: "Category",
  type: "select",
  options: ["Bug", "Feature"],
};

function makeSelectMock(rows: unknown[]) {
  const chain: Record<string, Mock> = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(rows)),
  };
  return chain;
}

function makeInsertMock(returned: unknown) {
  const chain = {
    values: vi.fn(() => chain),
    onConflictDoUpdate: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve([returned])),
  };
  return chain;
}

const TASK_ROW = { id: "task-1", projectId: "proj-1", workspaceId: "ws-1" };

describe("setTaskCustomFieldValue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws a 404 when the field does not exist", async () => {
    mockFindFirst.mockResolvedValue(undefined);

    await expect(
      setTaskCustomFieldValue("task-1", "missing-field", 5, "user-1"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects a non-number value for a number field", async () => {
    mockFindFirst.mockResolvedValue(NUMBER_FIELD);

    await expect(
      setTaskCustomFieldValue("task-1", "field-1", "not-a-number", "user-1"),
    ).rejects.toMatchObject({ status: 400 });

    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects a non-boolean value for a checkbox field", async () => {
    mockFindFirst.mockResolvedValue(CHECKBOX_FIELD);

    await expect(
      setTaskCustomFieldValue("task-1", "field-2", "yes", "user-1"),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a select value outside the field's options", async () => {
    mockFindFirst.mockResolvedValue(SELECT_FIELD);

    await expect(
      setTaskCustomFieldValue("task-1", "field-3", "Chore", "user-1"),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("accepts a valid number value, upserts it, and publishes an event", async () => {
    mockFindFirst.mockResolvedValue(NUMBER_FIELD);
    mockSelect.mockReturnValue(makeSelectMock([TASK_ROW]));
    const insertedValue = {
      id: "value-1",
      fieldId: "field-1",
      taskId: "task-1",
      value: 5,
    };
    mockInsert.mockReturnValue(makeInsertMock(insertedValue));

    const result = await setTaskCustomFieldValue(
      "task-1",
      "field-1",
      5,
      "user-1",
    );

    expect(result).toEqual(insertedValue);
    expect(mockPublishEvent).toHaveBeenCalledWith("task.custom_field_updated", {
      projectId: "proj-1",
      taskId: "task-1",
      userId: "user-1",
      type: "custom_field_updated",
    });
  });

  it("throws a 404 when the task does not exist", async () => {
    mockFindFirst.mockResolvedValue(NUMBER_FIELD);
    mockSelect.mockReturnValue(makeSelectMock([]));

    await expect(
      setTaskCustomFieldValue("missing-task", "field-1", 5, "user-1"),
    ).rejects.toMatchObject({ status: 404 });

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
