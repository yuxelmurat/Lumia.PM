import { eq } from "drizzle-orm";
import db from "../../database";
import { assetTable, projectTable, taskTable } from "../../database/schema";
import createNotification from "../../notification/controllers/create-notification";

async function notifyPinCreated(
  assetId: string,
  actorLabel: string,
  excludeUserId?: string,
) {
  const [asset] = await db
    .select({ taskId: assetTable.taskId, filename: assetTable.filename })
    .from(assetTable)
    .where(eq(assetTable.id, assetId))
    .limit(1);

  if (!asset?.taskId) return;

  const [task] = await db
    .select({
      assigneeId: taskTable.userId,
      title: taskTable.title,
      projectId: taskTable.projectId,
      workspaceId: projectTable.workspaceId,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(eq(taskTable.id, asset.taskId));

  if (!task?.assigneeId || task.assigneeId === excludeUserId) return;

  await createNotification({
    userId: task.assigneeId,
    type: "asset_pin_created",
    eventData: {
      taskTitle: task.title,
      assetFilename: asset.filename,
      actorLabel,
      projectId: task.projectId,
      workspaceId: task.workspaceId,
    },
    resourceId: asset.taskId,
    resourceType: "task",
  });
}

export default notifyPinCreated;
