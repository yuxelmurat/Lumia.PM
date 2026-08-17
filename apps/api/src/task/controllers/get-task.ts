import { and, asc, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  assetTable,
  imagePinTable,
  taskApprovalTable,
  taskTable,
  userTable,
} from "../../database/schema";
import { normalizeApiServerUrl } from "../../utils/openapi-spec";

async function getTask(taskId: string) {
  const task = await db
    .select({
      id: taskTable.id,
      title: taskTable.title,
      number: taskTable.number,
      description: taskTable.description,
      status: taskTable.status,
      priority: taskTable.priority,
      startDate: taskTable.startDate,
      dueDate: taskTable.dueDate,
      position: taskTable.position,
      createdAt: taskTable.createdAt,
      userId: taskTable.userId,
      assigneeName: userTable.name,
      assigneeId: userTable.id,
      projectId: taskTable.projectId,
      approvalStatus: taskTable.approvalStatus,
      approvalNote: taskTable.approvalNote,
      approvalClientName: taskTable.approvalClientName,
      approvalRespondedAt: taskTable.approvalRespondedAt,
      isPublic: taskTable.isPublic,
      publicShareToken: taskTable.publicShareToken,
      publicLinkExpiresAt: taskTable.publicLinkExpiresAt,
    })
    .from(taskTable)
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .where(eq(taskTable.id, taskId))
    .limit(1);

  if (!task.length || !task[0]) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  const approvals = await db
    .select({
      id: taskApprovalTable.id,
      clientName: taskApprovalTable.clientName,
      status: taskApprovalTable.status,
      note: taskApprovalTable.note,
      respondedAt: taskApprovalTable.respondedAt,
    })
    .from(taskApprovalTable)
    .where(eq(taskApprovalTable.taskId, taskId))
    .orderBy(asc(taskApprovalTable.respondedAt));

  const imageAssets = await db
    .select({
      id: assetTable.id,
      filename: assetTable.filename,
      versionGroupId: assetTable.versionGroupId,
      versionNumber: assetTable.versionNumber,
      createdAt: assetTable.createdAt,
    })
    .from(assetTable)
    .where(and(eq(assetTable.taskId, taskId), eq(assetTable.kind, "image")))
    .orderBy(asc(assetTable.createdAt));

  const apiBaseUrl = normalizeApiServerUrl(
    process.env.KANEO_API_URL || "http://localhost:1337",
  );

  // A "moodboard" gallery shows one thumbnail per render, not one per
  // upload — group by version chain and keep only the latest revision.
  const latestByGroup = new Map<string, (typeof imageAssets)[number]>();
  for (const asset of imageAssets) {
    const groupKey = asset.versionGroupId ?? asset.id;
    const current = latestByGroup.get(groupKey);
    if (!current || asset.versionNumber > current.versionNumber) {
      latestByGroup.set(groupKey, asset);
    }
  }
  const latestAssetIds = Array.from(latestByGroup.values()).map(
    (asset) => asset.id,
  );
  const pins =
    latestAssetIds.length > 0
      ? await db
          .select({
            id: imagePinTable.id,
            assetId: imagePinTable.assetId,
            xPercent: imagePinTable.xPercent,
            yPercent: imagePinTable.yPercent,
            content: imagePinTable.content,
            clientName: imagePinTable.clientName,
            resolved: imagePinTable.resolved,
            createdAt: imagePinTable.createdAt,
          })
          .from(imagePinTable)
          .where(inArray(imagePinTable.assetId, latestAssetIds))
          .orderBy(asc(imagePinTable.createdAt))
      : [];
  const assetPinsMap = new Map<string, typeof pins>();
  for (const pin of pins) {
    if (!assetPinsMap.has(pin.assetId)) {
      assetPinsMap.set(pin.assetId, []);
    }
    assetPinsMap.get(pin.assetId)?.push(pin);
  }

  const images = Array.from(latestByGroup.values())
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((asset) => ({
      id: asset.id,
      url: `${apiBaseUrl}/asset/${asset.id}`,
      filename: asset.filename,
      versionNumber: asset.versionNumber,
      pins: assetPinsMap.get(asset.id) || [],
    }));

  return { ...task[0], approvals, images };
}

export default getTask;
