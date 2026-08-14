import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";

async function setPublicLinkExpiry(
  id: string,
  workspaceId: string,
  expiresAt: Date | null,
) {
  const project = await db.query.projectTable.findFirst({
    where: eq(projectTable.id, id),
  });

  if (!project || project.workspaceId !== workspaceId) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  const [updatedProject] = await db
    .update(projectTable)
    .set({ publicLinkExpiresAt: expiresAt })
    .where(eq(projectTable.id, id))
    .returning();

  if (!updatedProject) {
    throw new HTTPException(500, {
      message: "Failed to update public link expiry",
    });
  }

  return updatedProject;
}

export default setPublicLinkExpiry;
