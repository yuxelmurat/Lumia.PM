import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  projectTemplateColumnTable,
  projectTemplateTable,
  projectTemplateTaskTable,
} from "../../database/schema";

export type CreateProjectTemplateColumnInput = {
  name: string;
  slug: string;
  position: number;
  isFinal?: boolean;
  icon?: string | null;
  color?: string | null;
};

export type CreateProjectTemplateTaskInput = {
  title: string;
  description?: string | null;
  columnSlug: string;
  position: number;
};

function validateColumnsAndTasks(
  columns: CreateProjectTemplateColumnInput[],
  tasks: CreateProjectTemplateTaskInput[],
) {
  if (columns.length === 0) {
    throw new HTTPException(400, {
      message: "A project template requires at least one column",
    });
  }

  const columnSlugs = new Set(columns.map((column) => column.slug));

  for (const task of tasks) {
    if (!columnSlugs.has(task.columnSlug)) {
      throw new HTTPException(400, {
        message: `Task "${task.title}" references unknown column slug "${task.columnSlug}"`,
      });
    }
  }
}

async function createProjectTemplate(
  workspaceId: string,
  name: string,
  description: string | undefined,
  icon: string | undefined,
  columns: CreateProjectTemplateColumnInput[],
  tasks: CreateProjectTemplateTaskInput[] = [],
) {
  validateColumnsAndTasks(columns, tasks);

  return db.transaction(async (tx) => {
    const [createdTemplate] = await tx
      .insert(projectTemplateTable)
      .values({
        workspaceId,
        name,
        description: description ?? null,
        icon: icon ?? "Layout",
      })
      .returning();

    if (!createdTemplate) {
      throw new Error("Failed to create project template");
    }

    if (columns.length > 0) {
      await tx.insert(projectTemplateColumnTable).values(
        columns.map((column) => ({
          templateId: createdTemplate.id,
          name: column.name,
          slug: column.slug,
          position: column.position,
          isFinal: column.isFinal ?? false,
          icon: column.icon ?? null,
          color: column.color ?? null,
        })),
      );
    }

    if (tasks.length > 0) {
      await tx.insert(projectTemplateTaskTable).values(
        tasks.map((task) => ({
          templateId: createdTemplate.id,
          title: task.title,
          description: task.description ?? null,
          columnSlug: task.columnSlug,
          position: task.position,
        })),
      );
    }

    return createdTemplate;
  });
}

export default createProjectTemplate;
