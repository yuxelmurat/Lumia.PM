import { eq } from "drizzle-orm";
import db from "../../database";
import { projectTable, workspaceTable } from "../../database/schema";
import { resolvePublicTask } from "../../utils/resolve-public-task";
import getTask from "./get-task";

export async function getPublicTask(token: string) {
  const task = await resolvePublicTask(token);
  const full = await getTask(task.id);

  const [project] = await db
    .select({
      id: projectTable.id,
      name: projectTable.name,
      workspaceId: projectTable.workspaceId,
    })
    .from(projectTable)
    .where(eq(projectTable.id, task.projectId))
    .limit(1);

  // Only name+logo+accentColor are shown on this public, unauthenticated
  // route — same trimmed shape as the public-project route.
  const [workspace] = project
    ? await db
        .select({
          name: workspaceTable.name,
          logo: workspaceTable.logo,
          accentColor: workspaceTable.accentColor,
        })
        .from(workspaceTable)
        .where(eq(workspaceTable.id, project.workspaceId))
        .limit(1)
    : [];

  return {
    ...full,
    projectName: project?.name ?? null,
    workspaceName: workspace?.name ?? null,
    workspaceLogo: workspace?.logo ?? null,
    workspaceAccentColor: workspace?.accentColor ?? null,
  };
}

export default getPublicTask;
