import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockTaskFindFirst = vi.fn();
const mockProjectFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockPublishEvent = vi.fn();

vi.mock("../../../apps/api/src/database", () => ({
  default: {
    query: {
      taskTable: {
        findFirst: (...args: unknown[]) => mockTaskFindFirst(...args),
      },
      projectTable: {
        findFirst: (...args: unknown[]) => mockProjectFindFirst(...args),
      },
    },
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock("../../../apps/api/src/events", () => ({
  publishEvent: (...args: unknown[]) => mockPublishEvent(...args),
}));

import setTaskApproval from "../../../apps/api/src/task/controllers/set-task-approval";

const TASK = {
  id: "task-1",
  projectId: "proj-1",
  title: "Render v1",
  userId: "assignee-1",
};

const PUBLIC_PROJECT = { id: "proj-1", isPublic: true };
const PRIVATE_PROJECT = { id: "proj-1", isPublic: false };

function makeUpdateMock(returned: unknown) {
  const chain = {
    set: vi.fn(() => chain),
    where: vi.fn(() => chain),
    returning: vi.fn(() => Promise.resolve([returned])),
  };
  return chain;
}

describe("setTaskApproval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("approves a task and updates the four columns, returning 200-shaped data", async () => {
    mockTaskFindFirst.mockResolvedValue(TASK);
    mockProjectFindFirst.mockResolvedValue(PUBLIC_PROJECT);
    const updatedTask = {
      ...TASK,
      approvalStatus: "approved",
      approvalNote: null,
      approvalClientName: "Jane Client",
      approvalRespondedAt: new Date(),
    };
    mockUpdate.mockReturnValue(makeUpdateMock(updatedTask));

    const result = await setTaskApproval({
      projectId: "proj-1",
      taskId: "task-1",
      status: "approved",
      clientName: "Jane Client",
    });

    expect(result).toEqual(updatedTask);
    expect(mockPublishEvent).toHaveBeenCalledWith("task.approval_updated", {
      taskId: "task-1",
      projectId: "proj-1",
      status: "approved",
      clientName: "Jane Client",
      note: null,
      title: "Render v1",
      assigneeId: "assignee-1",
      type: "approval_updated",
    });
  });

  it("rejects an empty clientName with 400", async () => {
    mockTaskFindFirst.mockResolvedValue(TASK);
    mockProjectFindFirst.mockResolvedValue(PUBLIC_PROJECT);

    await expect(
      setTaskApproval({
        projectId: "proj-1",
        taskId: "task-1",
        status: "changes_requested",
        clientName: "   ",
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid status with 400", async () => {
    mockTaskFindFirst.mockResolvedValue(TASK);
    mockProjectFindFirst.mockResolvedValue(PUBLIC_PROJECT);

    await expect(
      setTaskApproval({
        projectId: "proj-1",
        taskId: "task-1",
        status: "rejected",
        clientName: "Jane Client",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("returns 403 when the project is not public", async () => {
    mockTaskFindFirst.mockResolvedValue(TASK);
    mockProjectFindFirst.mockResolvedValue(PRIVATE_PROJECT);

    await expect(
      setTaskApproval({
        projectId: "proj-1",
        taskId: "task-1",
        status: "approved",
        clientName: "Jane Client",
      }),
    ).rejects.toMatchObject({ status: 403 });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the task does not exist", async () => {
    mockTaskFindFirst.mockResolvedValue(undefined);

    await expect(
      setTaskApproval({
        projectId: "proj-1",
        taskId: "missing-task",
        status: "approved",
        clientName: "Jane Client",
      }),
    ).rejects.toMatchObject({ status: 404 });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the task belongs to a different project than :projectId", async () => {
    mockTaskFindFirst.mockResolvedValue({ ...TASK, projectId: "other-proj" });

    await expect(
      setTaskApproval({
        projectId: "proj-1",
        taskId: "task-1",
        status: "approved",
        clientName: "Jane Client",
      }),
    ).rejects.toMatchObject({ status: 404 });

    expect(mockProjectFindFirst).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("caps note length at 2000 characters", async () => {
    mockTaskFindFirst.mockResolvedValue(TASK);
    mockProjectFindFirst.mockResolvedValue(PUBLIC_PROJECT);

    await expect(
      setTaskApproval({
        projectId: "proj-1",
        taskId: "task-1",
        status: "changes_requested",
        clientName: "Jane Client",
        note: "x".repeat(2001),
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
