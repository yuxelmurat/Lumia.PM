import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import { taskTable } from "../database/schema";

/**
 * Resolves a task-level public share token, enforcing the same checks as
 * resolvePublicProject but scoped to a single task: token exists, the task
 * is still public, and the link hasn't expired. A task-share link never
 * exposes the rest of the project board — only this task's own detail.
 */
export async function resolvePublicTask(token: string) {
  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.publicShareToken, token),
  });

  if (!task) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  if (!task.isPublic) {
    throw new HTTPException(403, {
      message: "Task is not public",
    });
  }

  if (task.publicLinkExpiresAt && task.publicLinkExpiresAt < new Date()) {
    throw new HTTPException(410, {
      message: "This link has expired",
    });
  }

  return task;
}
