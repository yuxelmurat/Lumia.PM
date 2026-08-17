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
  dueDate,
  estimatedHours,
}: {
  projectId: string;
  userId: string | null;
  columnId: string;
  dueDate: Date;
  estimatedHours: number | null;
}) {
  taskNumberCounter += 1;
  const [task] = await db
    .insert(schema.taskTable)
    .values({
      projectId,
      userId,
      title: "Workload test task",
      status: "to-do",
      columnId,
      priority: "medium",
      number: taskNumberCounter,
      position: 1,
      dueDate,
      estimatedHours,
    })
    .returning();

  if (!task) {
    throw new Error("Failed to seed task fixture");
  }
  return task;
}

describe("API integration: Workload", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("sums estimated hours by assignee and due-date week, ignoring done tasks", async () => {
    const member = await createWorkspaceMember();
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    const weekStart = new Date();
    weekStart.setUTCHours(12, 0, 0, 0);

    await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.todo.id,
      dueDate: weekStart,
      estimatedHours: 6,
    });
    await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.inProgress.id,
      dueDate: weekStart,
      estimatedHours: 10,
    });
    // Done tasks should not count toward workload.
    await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.done.id,
      dueDate: weekStart,
      estimatedHours: 100,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const response = await app.request(`/api/workload/${member.workspace.id}`);
    expect(response.status).toBe(200);

    const rows = (await response.json()) as Array<{
      userId: string;
      userName: string | null;
      weeks: Array<{
        weekStart: string;
        totalHours: number;
        taskCount: number;
      }>;
    }>;

    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(member.user.id);
    const week = rows[0]?.weeks.find((w) => w.taskCount > 0);
    expect(week?.totalHours).toBe(16);
    expect(week?.taskCount).toBe(2);
  });

  it("rejects unauthorized workspace access", async () => {
    const member = await createWorkspaceMember();
    const outsider = await createWorkspaceMember();

    mockAuthenticatedSession(outsider.user);
    const { app } = createApp();

    const response = await app.request(`/api/workload/${member.workspace.id}`);
    expect(response.status).toBe(403);
  });
});
