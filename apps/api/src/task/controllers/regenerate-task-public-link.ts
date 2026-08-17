import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskTable } from "../../database/schema";
import { generatePublicShareToken } from "../../utils/migrate-public-share-tokens";

/** Rotates the task's public share token, permanently invalidating any previously shared link. */
async function regenerateTaskPublicLink(id: string) {
  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, id),
  });

  if (!task) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  const [updatedTask] = await db
    .update(taskTable)
    .set({ publicShareToken: generatePublicShareToken() })
    .where(eq(taskTable.id, id))
    .returning();

  if (!updatedTask) {
    throw new HTTPException(500, {
      message: "Failed to regenerate public link",
    });
  }

  return updatedTask;
}

export default regenerateTaskPublicLink;
