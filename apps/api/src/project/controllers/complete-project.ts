import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";
import countOpenPunchItems from "./count-open-punch-items";

async function completeProject(id: string, workspaceId: string) {
  const [existingProject] = await db
    .select()
    .from(projectTable)
    .where(
      and(eq(projectTable.id, id), eq(projectTable.workspaceId, workspaceId)),
    );

  if (!existingProject) {
    throw new HTTPException(404, {
      message:
        "Project doesn't exist or doesn't belong to the specified workspace",
    });
  }

  const openPunchItemCount = await countOpenPunchItems(id);
  if (openPunchItemCount > 0) {
    throw new HTTPException(409, {
      message: `${openPunchItemCount} punch list item(s) are still open`,
    });
  }

  const [completedProject] = await db
    .update(projectTable)
    .set({ completedAt: new Date() })
    .where(eq(projectTable.id, id))
    .returning();

  if (!completedProject) {
    throw new HTTPException(500, {
      message: "Failed to complete project",
    });
  }

  return completedProject;
}

export default completeProject;
