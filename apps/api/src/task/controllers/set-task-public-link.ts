import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskTable } from "../../database/schema";
import { generatePublicShareToken } from "../../utils/migrate-public-share-tokens";

/**
 * Toggles a single task's own share link on/off and optionally sets its
 * expiry. A first-time enable mints the token; disabling clears it so a
 * previously shared link stops resolving instead of just going dark behind
 * `isPublic: false` (matches project sharing's revoke-by-token-rotation
 * intent, but here we drop the token outright since re-enabling later
 * should hand out a fresh link, not silently revive the old one).
 */
async function setTaskPublicLink(
  id: string,
  isPublic: boolean,
  expiresAt: Date | null,
) {
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
    .set({
      isPublic,
      publicShareToken: isPublic
        ? task.publicShareToken || generatePublicShareToken()
        : null,
      publicLinkExpiresAt: isPublic ? expiresAt : null,
    })
    .where(eq(taskTable.id, id))
    .returning();

  if (!updatedTask) {
    throw new HTTPException(500, {
      message: "Failed to update task sharing",
    });
  }

  return updatedTask;
}

export default setTaskPublicLink;
