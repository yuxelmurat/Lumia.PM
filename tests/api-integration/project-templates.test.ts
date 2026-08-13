import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import { createWorkspaceMember } from "./helpers/fixtures";

describe("API integration: project templates and column budgets", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("seeds architecture-phase columns when projectType is architecture", async () => {
    const member = await createWorkspaceMember();
    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const response = await app.request("/api/project", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId: member.workspace.id,
        name: "Villa Renovation",
        icon: "Folder",
        slug: "villa-renovation",
        projectType: "architecture",
      }),
    });

    expect(response.status).toBe(200);
    const project = (await response.json()) as { id: string };

    const columns = await db.query.columnTable.findMany({
      where: eq(schema.columnTable.projectId, project.id),
      orderBy: (column, { asc }) => [asc(column.position)],
    });

    expect(columns.map((column) => column.slug)).toEqual([
      "concept",
      "schematic-design",
      "design-development",
      "construction-documents",
      "construction-administration",
    ]);
    expect(columns.map((column) => column.isFinal)).toEqual([
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it("seeds interior-design-phase columns when projectType is interior_design", async () => {
    const member = await createWorkspaceMember();
    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const response = await app.request("/api/project", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId: member.workspace.id,
        name: "Loft Interior",
        icon: "Folder",
        slug: "loft-interior",
        projectType: "interior_design",
      }),
    });

    expect(response.status).toBe(200);
    const project = (await response.json()) as { id: string };

    const columns = await db.query.columnTable.findMany({
      where: eq(schema.columnTable.projectId, project.id),
      orderBy: (column, { asc }) => [asc(column.position)],
    });

    expect(columns.map((column) => column.slug)).toEqual([
      "discovery",
      "concept",
      "design-development",
      "construction-drawings",
      "procurement",
      "installation",
    ]);
  });

  it("defaults to the generic template when projectType is omitted", async () => {
    const member = await createWorkspaceMember();
    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const response = await app.request("/api/project", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId: member.workspace.id,
        name: "Generic Project",
        icon: "Folder",
        slug: "generic-project",
      }),
    });

    expect(response.status).toBe(200);
    const project = (await response.json()) as { id: string };

    const columns = await db.query.columnTable.findMany({
      where: eq(schema.columnTable.projectId, project.id),
    });
    expect(columns.map((column) => column.slug).sort()).toEqual([
      "done",
      "in-progress",
      "in-review",
      "to-do",
    ]);
  });

  it("sets a column budget via update-column and rolls up consumed time in get-tasks", async () => {
    const member = await createWorkspaceMember({ role: "admin" });
    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const createResponse = await app.request("/api/project", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId: member.workspace.id,
        name: "Budget Project",
        icon: "Folder",
        slug: "budget-project",
      }),
    });
    const project = (await createResponse.json()) as { id: string };

    const columns = await db.query.columnTable.findMany({
      where: eq(schema.columnTable.projectId, project.id),
    });
    const todoColumn = columns.find((column) => column.slug === "to-do");
    if (!todoColumn) throw new Error("to-do column not seeded");

    const updateResponse = await app.request(`/api/column/${todoColumn.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ budgetHours: 10 }),
    });
    expect(updateResponse.status).toBe(200);
    const updatedColumn = (await updateResponse.json()) as {
      budgetHours: number | null;
    };
    expect(updatedColumn.budgetHours).toBe(10);

    const [task] = await db
      .insert(schema.taskTable)
      .values({
        projectId: project.id,
        number: 1,
        title: "Site survey",
        status: "to-do",
        columnId: todoColumn.id,
      })
      .returning();

    await db.insert(schema.timeEntryTable).values({
      taskId: task.id,
      userId: member.user.id,
      startTime: new Date("2026-01-01T09:00:00Z"),
      endTime: new Date("2026-01-01T13:00:00Z"),
      duration: 4 * 60 * 60,
    });

    const tasksResponse = await app.request(`/api/task/tasks/${project.id}`);
    expect(tasksResponse.status).toBe(200);
    const payload = (await tasksResponse.json()) as {
      data: {
        columns: {
          slug: string;
          columnId: string;
          budgetHours: number | null;
          consumedSeconds: number;
        }[];
      };
    };

    const todoColumnData = payload.data.columns.find(
      (column) => column.slug === "to-do",
    );
    expect(todoColumnData).toMatchObject({
      columnId: todoColumn.id,
      budgetHours: 10,
      consumedSeconds: 4 * 60 * 60,
    });
  });
});
