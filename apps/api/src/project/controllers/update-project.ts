import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";
import { generatePublicShareToken } from "../../utils/migrate-public-share-tokens";

async function updateProject(
  id: string,
  name: string,
  icon: string,
  slug: string,
  description: string,
  isPublic: boolean,
  workspaceId: string,
) {
  const [existingProject] = await db
    .select()
    .from(projectTable)
    .where(
      and(eq(projectTable.id, id), eq(projectTable.workspaceId, workspaceId)),
    );

  const isProjectExisting = Boolean(existingProject);

  if (!isProjectExisting) {
    throw new HTTPException(404, {
      message:
        "Project doesn't exist or doesn't belong to the specified workspace",
    });
  }

  // First time this project ever goes public: mint its share token. Later
  // off/on toggles reuse the same token — only an explicit "regenerate"
  // rotates it, so flipping visibility off and back on doesn't silently
  // change the link a client already has.
  const needsToken = isPublic && !existingProject?.publicShareToken;

  const [updatedWorkspace] = await db
    .update(projectTable)
    .set({
      name,
      icon,
      slug,
      description,
      isPublic,
      ...(needsToken ? { publicShareToken: generatePublicShareToken() } : {}),
    })
    .where(eq(projectTable.id, id))
    .returning();

  return updatedWorkspace;
}

export default updateProject;
