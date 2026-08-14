import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import { projectTable } from "../database/schema";

/**
 * Resolves a public share token to its project, enforcing the same checks
 * every unauthenticated public-project entry point needs: token exists,
 * the project is still public, and the link hasn't expired. Centralized so
 * the read route and the client-approval write route can't drift.
 */
export async function resolvePublicProject(token: string) {
  const project = await db.query.projectTable.findFirst({
    where: eq(projectTable.publicShareToken, token),
  });

  if (!project) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  if (!project.isPublic) {
    throw new HTTPException(403, {
      message: "Project is not public",
    });
  }

  if (project.publicLinkExpiresAt && project.publicLinkExpiresAt < new Date()) {
    throw new HTTPException(410, {
      message: "This link has expired",
    });
  }

  return project;
}
