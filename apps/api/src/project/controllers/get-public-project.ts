import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { workspaceTable } from "../../database/schema";
import getTasks from "../../task/controllers/get-tasks";
import { resolvePublicProject } from "../../utils/resolve-public-project";

export async function getPublicProject(token: string) {
  const project = await resolvePublicProject(token);

  const result = await getTasks(project.id);

  if (!result.data) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  // Only name+logo are shown on this public, unauthenticated route — the
  // rest of the company profile (tax id, address, phone) stays private to
  // workspace settings.
  const [workspace] = await db
    .select({ name: workspaceTable.name, logo: workspaceTable.logo })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, result.data.workspaceId))
    .limit(1);

  return {
    ...result.data,
    workspaceName: workspace?.name ?? null,
    workspaceLogo: workspace?.logo ?? null,
  };
}
