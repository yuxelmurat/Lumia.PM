import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";
import { generatePublicShareToken } from "../../utils/migrate-public-share-tokens";

/** Rotates the project's public share token, permanently invalidating any previously shared link. */
async function regeneratePublicLink(id: string, workspaceId: string) {
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
    .set({ publicShareToken: generatePublicShareToken() })
    .where(eq(projectTable.id, id))
    .returning();

  if (!updatedProject) {
    throw new HTTPException(500, {
      message: "Failed to regenerate public link",
    });
  }

  return updatedProject;
}

export default regeneratePublicLink;
