import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  customFieldValueTable,
  projectTable,
  taskTable,
} from "../../database/schema";
import { publishEvent } from "../../events";

type CustomFieldValueInput = string | number | boolean | string[];

function assertValueMatchesType(
  type: string,
  options: string[] | null,
  value: CustomFieldValueInput,
) {
  switch (type) {
    case "text":
    case "date":
      if (typeof value !== "string") {
        throw new HTTPException(400, {
          message: `Value for a "${type}" field must be a string`,
        });
      }
      return;
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new HTTPException(400, {
          message: 'Value for a "number" field must be a number',
        });
      }
      return;
    case "checkbox":
      if (typeof value !== "boolean") {
        throw new HTTPException(400, {
          message: 'Value for a "checkbox" field must be a boolean',
        });
      }
      return;
    case "select":
      if (typeof value !== "string" || !options?.includes(value)) {
        throw new HTTPException(400, {
          message:
            'Value for a "select" field must be one of the field\'s options',
        });
      }
      return;
    default:
      throw new HTTPException(400, {
        message: `Unknown custom field type: ${type}`,
      });
  }
}

async function setTaskCustomFieldValue(
  taskId: string,
  fieldId: string,
  value: CustomFieldValueInput,
  userId: string,
) {
  const field = await db.query.customFieldDefinitionTable.findFirst({
    where: (customField, { eq }) => eq(customField.id, fieldId),
  });

  if (!field) {
    throw new HTTPException(404, {
      message: "Custom field not found",
    });
  }

  assertValueMatchesType(
    field.type,
    (field.options as string[] | null) ?? null,
    value,
  );

  const [task] = await db
    .select({
      id: taskTable.id,
      projectId: taskTable.projectId,
      workspaceId: projectTable.workspaceId,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(eq(taskTable.id, taskId))
    .limit(1);

  if (!task) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  if (task.workspaceId !== field.workspaceId) {
    throw new HTTPException(400, {
      message: "Custom field does not belong to the task's workspace",
    });
  }

  const [upserted] = await db
    .insert(customFieldValueTable)
    .values({ fieldId, taskId, value })
    .onConflictDoUpdate({
      target: [customFieldValueTable.fieldId, customFieldValueTable.taskId],
      set: { value },
    })
    .returning();

  if (!upserted) {
    throw new Error("Failed to set custom field value");
  }

  await publishEvent("task.custom_field_updated", {
    projectId: task.projectId,
    taskId: task.id,
    userId,
    type: "custom_field_updated",
  });

  return upserted;
}

export default setTaskCustomFieldValue;
