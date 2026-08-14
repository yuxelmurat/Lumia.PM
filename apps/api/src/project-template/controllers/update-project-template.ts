import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  projectTemplateColumnTable,
  projectTemplateTable,
  projectTemplateTaskTable,
} from "../../database/schema";
import type {
  CreateProjectTemplateColumnInput,
  CreateProjectTemplateTaskInput,
} from "./create-project-template";

type UpdateProjectTemplateInput = {
  name?: string;
  description?: string | null;
  icon?: string | null;
  columns: CreateProjectTemplateColumnInput[];
  tasks?: CreateProjectTemplateTaskInput[];
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

async function updateProjectTemplate(
  id: string,
  input: UpdateProjectTemplateInput,
) {
  const { columns, tasks = [] } = input;
  validateColumnsAndTasks(columns, tasks);

  return db.transaction(async (tx) => {
    const existing = await tx.query.projectTemplateTable.findFirst({
      where: (template, { eq }) => eq(template.id, id),
    });

    if (!existing) {
      throw new HTTPException(404, {
        message: "Project template not found",
      });
    }

    const [updated] = await tx
      .update(projectTemplateTable)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
      })
      .where(eq(projectTemplateTable.id, id))
      .returning();

    if (!updated) {
      throw new HTTPException(404, {
        message: "Project template not found",
      });
    }

    await tx
      .delete(projectTemplateTaskTable)
      .where(eq(projectTemplateTaskTable.templateId, id));
    await tx
      .delete(projectTemplateColumnTable)
      .where(eq(projectTemplateColumnTable.templateId, id));

    if (columns.length > 0) {
      await tx.insert(projectTemplateColumnTable).values(
        columns.map((column) => ({
          templateId: id,
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
          templateId: id,
          title: task.title,
          description: task.description ?? null,
          columnSlug: task.columnSlug,
          position: task.position,
        })),
      );
    }

    return updated;
  });
}

export default updateProjectTemplate;
