import { eq, max, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { columnTable, projectTable, taskTable } from "../../database/schema";
import claimTaskNumbers from "../../task/controllers/claim-task-numbers";

export const DEFAULT_PROJECT_COLUMNS = [
  { name: "To Do", slug: "to-do", position: 0, isFinal: false },
  { name: "In Progress", slug: "in-progress", position: 1, isFinal: false },
  { name: "In Review", slug: "in-review", position: 2, isFinal: false },
  { name: "Done", slug: "done", position: 3, isFinal: true },
] as const;

async function createProject(
  workspaceId: string,
  name: string,
  icon: string,
  slug: string,
  templateId?: string,
) {
  return db.transaction(async (tx) => {
    // Serialize ordering writes per workspace: without this, two concurrent
    // creates can read the same max(position) and land on the same slot, and a
    // create can interleave with a reorder's renumber. `reorderProjects` takes
    // the same lock with the same key.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(1524, hashtext(${workspaceId}))`,
    );

    let templateColumns: {
      name: string;
      slug: string;
      position: number;
      isFinal: boolean;
      icon: string | null;
      color: string | null;
    }[] = DEFAULT_PROJECT_COLUMNS.map((col) => ({
      name: col.name,
      slug: col.slug,
      position: col.position,
      isFinal: col.isFinal,
      icon: null,
      color: null,
    }));
    let templateTasks: {
      title: string;
      description: string | null;
      columnSlug: string;
      position: number;
    }[] = [];

    if (templateId) {
      const template = await tx.query.projectTemplateTable.findFirst({
        where: (projectTemplateTable, { and, eq }) =>
          and(
            eq(projectTemplateTable.id, templateId),
            eq(projectTemplateTable.workspaceId, workspaceId),
          ),
        with: {
          columns: { orderBy: (column, { asc }) => [asc(column.position)] },
          tasks: { orderBy: (task, { asc }) => [asc(task.position)] },
        },
      });

      if (!template) {
        throw new HTTPException(404, {
          message: "Project template not found",
        });
      }

      templateColumns = template.columns.map((col) => ({
        name: col.name,
        slug: col.slug,
        position: col.position,
        isFinal: col.isFinal,
        icon: col.icon,
        color: col.color,
      }));
      templateTasks = template.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        columnSlug: task.columnSlug,
        position: task.position,
      }));
    }

    // New projects go to the bottom of the workspace's ordering.
    const [{ maxPosition } = { maxPosition: null }] = await tx
      .select({ maxPosition: max(projectTable.position) })
      .from(projectTable)
      .where(eq(projectTable.workspaceId, workspaceId));

    const [createdProject] = await tx
      .insert(projectTable)
      .values({
        workspaceId,
        name,
        icon,
        slug,
        position: maxPosition === null ? 0 : maxPosition + 1,
      })
      .returning();

    if (createdProject) {
      const columnIdBySlug = new Map<string, string>();

      for (const col of templateColumns) {
        const [createdColumn] = await tx
          .insert(columnTable)
          .values({
            projectId: createdProject.id,
            name: col.name,
            slug: col.slug,
            position: col.position,
            isFinal: col.isFinal,
            icon: col.icon,
            color: col.color,
          })
          .returning();

        if (createdColumn) {
          columnIdBySlug.set(col.slug, createdColumn.id);
        }
      }

      if (templateTasks.length > 0) {
        const startingNumber = await claimTaskNumbers(
          createdProject.id,
          templateTasks.length,
          tx,
        );

        let number = startingNumber;
        for (const task of templateTasks) {
          const columnId = columnIdBySlug.get(task.columnSlug);
          await tx.insert(taskTable).values({
            projectId: createdProject.id,
            columnId: columnId ?? null,
            title: task.title,
            description: task.description,
            position: task.position,
            number,
            status: task.columnSlug,
          });
          number += 1;
        }
      }
    }

    return createdProject;
  });
}

export default createProject;
