import { beforeEach, describe, expect, it } from "vitest";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

let taskNumberCounter = 0;

async function createTaskFixture({
  projectId,
  userId,
  columnId,
  status,
  dueDate,
}: {
  projectId: string;
  userId: string | null;
  columnId: string;
  status: string;
  dueDate: Date | null;
}) {
  taskNumberCounter += 1;
  const [task] = await db
    .insert(schema.taskTable)
    .values({
      projectId,
      userId,
      title: `Dashboard test task ${taskNumberCounter}`,
      status,
      columnId,
      priority: "medium",
      number: taskNumberCounter,
      position: 1,
      dueDate,
    })
    .returning();

  if (!task) {
    throw new Error("Failed to seed task fixture");
  }
  return task;
}

describe("API integration: Dashboard", () => {
  beforeEach(async () => {
    await resetTestDatabase();
    taskNumberCounter = 0;
  });

  it("returns status counts, overdue tasks, and recent activity for the workspace", async () => {
    const member = await createWorkspaceMember();
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const overdueTask = await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.todo.id,
      status: "to-do",
      dueDate: yesterday,
    });
    await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.inProgress.id,
      status: "in-progress",
      dueDate: nextWeek,
    });
    // Overdue by due date but sitting in a final column: must not count as overdue.
    await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.done.id,
      status: "done",
      dueDate: yesterday,
    });

    await db.insert(schema.activityTable).values({
      taskId: overdueTask.id,
      type: "status_updated",
      content: "moved to In Progress",
      userId: member.user.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const response = await app.request(`/api/dashboard/${member.workspace.id}`);
    expect(response.status).toBe(200);

    const summary = (await response.json()) as {
      statusCounts: Array<{ status: string; count: number }>;
      overdueTasks: Array<{ id: string; projectName: string }>;
      recentActivity: Array<{
        id: string;
        taskId: string;
        projectId: string;
        projectName: string;
      }>;
    };

    const toDoCount = summary.statusCounts.find((s) => s.status === "to-do");
    expect(toDoCount?.count).toBe(1);
    const doneCount = summary.statusCounts.find((s) => s.status === "done");
    expect(doneCount?.count).toBe(1);

    expect(summary.overdueTasks).toHaveLength(1);
    expect(summary.overdueTasks[0]?.id).toBe(overdueTask.id);
    expect(summary.overdueTasks[0]?.projectName).toBe(project.name);

    expect(summary.recentActivity).toHaveLength(1);
    expect(summary.recentActivity[0]?.taskId).toBe(overdueTask.id);
    expect(summary.recentActivity[0]?.projectId).toBe(project.id);
    expect(summary.recentActivity[0]?.projectName).toBe(project.name);
  });

  it("rejects unauthorized workspace access", async () => {
    const member = await createWorkspaceMember();
    const outsider = await createWorkspaceMember();

    mockAuthenticatedSession(outsider.user);
    const { app } = createApp();

    const response = await app.request(`/api/dashboard/${member.workspace.id}`);
    expect(response.status).toBe(403);
  });
});
