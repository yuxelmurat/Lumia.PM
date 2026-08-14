import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { customFieldValueTable } from "../../database/schema";

async function deleteTaskCustomFieldValue(taskId: string, fieldId: string) {
  const [deleted] = await db
    .delete(customFieldValueTable)
    .where(
      and(
        eq(customFieldValueTable.taskId, taskId),
        eq(customFieldValueTable.fieldId, fieldId),
      ),
    )
    .returning();

  if (!deleted) {
    throw new HTTPException(404, {
      message: "Custom field value not found",
    });
  }

  return deleted;
}

export default deleteTaskCustomFieldValue;
