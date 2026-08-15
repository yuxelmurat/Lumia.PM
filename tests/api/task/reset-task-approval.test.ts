import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockTaskFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockPublishEvent = vi.fn();

function makeDeleteMock() {
  const chain = {
    where: vi.fn(() => Promise.resolve()),
  };
  return chain;
}

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    query: {
      taskTable: {
        findFirst: (...args: unknown[]) => mockTaskFindFirst(...args),
      },
    },
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

vi.mock("../../../apps/api/src/events", () => ({
  publishEvent: (...args: unknown[]) => mockPublishEvent(...args),
}));

import resetTaskApproval from "../../../apps/api/src/task/controllers/reset-task-approval";

const TASK = {
  id: "task-1",
  projectId: "proj-1",
  title: "Render v1",
  userId: "assignee-1",
  approvalStatus: "changes_requested",
  approvalNote: "please redo the lighting",
  approvalClientName: "Jane Client",
  approvalRespondedAt: new Date(),
};

function makeUpdateMock(returned: unknown) {
  const chain = {
    set: vi.fn(() => chain),
    where: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve([returned])),
  };
  return chain;
}

describe("resetTaskApproval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears the four approval columns and publishes a reset event", async () => {
    mockTaskFindFirst.mockResolvedValue(TASK);
    const updatedTask = {
      ...TASK,
      approvalStatus: null,
      approvalNote: null,
      approvalClientName: null,
      approvalRespondedAt: null,
    };
    mockUpdate.mockReturnValue(makeUpdateMock(updatedTask));
    mockDelete.mockReturnValue(makeDeleteMock());

    const result = await resetTaskApproval("task-1");

    expect(result).toEqual(updatedTask);
    expect(mockPublishEvent).toHaveBeenCalledWith("task.approval_updated", {
      taskId: "task-1",
      projectId: "proj-1",
      status: null,
      clientName: null,
      note: null,
      title: "Render v1",
      assigneeId: "assignee-1",
      type: "approval_updated",
    });
  });

  it("returns 404 when the task does not exist", async () => {
    mockTaskFindFirst.mockResolvedValue(undefined);

    await expect(resetTaskApproval("missing-task")).rejects.toMatchObject({
      status: 404,
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
