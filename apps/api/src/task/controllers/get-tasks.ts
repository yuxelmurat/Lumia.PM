import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  type SQL,
  sql,
} from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  assetTable,
  columnTable,
  externalLinkTable,
  imagePinTable,
  labelTable,
  projectTable,
  taskApprovalTable,
  taskTable,
  timeEntryTable,
  userTable,
} from "../../database/schema";
import { normalizeApiServerUrl } from "../../utils/openapi-spec";

type GetTasksOptions = {
  assigneeId?: string;
  dueAfter?: string;
  dueBefore?: string;
  limit?: number;
  page?: number;
  priority?: string;
  sortBy?:
    | "createdAt"
    | "priority"
    | "dueDate"
    | "position"
    | "title"
    | "number";
  sortOrder?: "asc" | "desc";
  status?: string;
};

const priorityCaseExpr = sql<number>`CASE
  WHEN ${taskTable.priority} = 'urgent' THEN 4
  WHEN ${taskTable.priority} = 'high' THEN 3
  WHEN ${taskTable.priority} = 'medium' THEN 2
  WHEN ${taskTable.priority} = 'low' THEN 1
  ELSE 0
END`;

function buildOrderBy(
  sortBy: GetTasksOptions["sortBy"],
  sortOrder: GetTasksOptions["sortOrder"],
): SQL {
  const direction = sortOrder === "desc" ? desc : asc;

  switch (sortBy) {
    case "createdAt":
      return direction(taskTable.createdAt);
    case "priority":
      return direction(priorityCaseExpr);
    case "dueDate":
      return direction(taskTable.dueDate);
    case "title":
      return direction(taskTable.title);
    case "number":
      return direction(taskTable.number);
    default:
      return direction(taskTable.position);
  }
}

async function getTasks(projectId: string, options: GetTasksOptions = {}) {
  const project = await db.query.projectTable.findFirst({
    where: eq(projectTable.id, projectId),
  });

  if (!project) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  const conditions = [eq(taskTable.projectId, projectId)];

  if (options.status) {
    conditions.push(eq(taskTable.status, options.status));
  }

  if (options.priority) {
    conditions.push(eq(taskTable.priority, options.priority));
  }

  if (options.assigneeId) {
    conditions.push(eq(taskTable.userId, options.assigneeId));
  }

  if (options.dueBefore) {
    conditions.push(lte(taskTable.dueDate, new Date(options.dueBefore)));
  }

  if (options.dueAfter) {
    conditions.push(gte(taskTable.dueDate, new Date(options.dueAfter)));
  }

  const whereClause = and(...conditions);
  const usePagination = options.page != null || options.limit != null;
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize =
    options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 50;
  const offset = (page - 1) * pageSize;

  const orderByClause = buildOrderBy(
    options.sortBy ?? "position",
    options.sortOrder ?? "asc",
  );

  const [taskCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(taskTable)
    .where(whereClause);

  const total = Number(taskCount?.count ?? 0);

  const taskSelection = {
    id: taskTable.id,
    title: taskTable.title,
    number: taskTable.number,
    description: taskTable.description,
    status: taskTable.status,
    priority: taskTable.priority,
    startDate: taskTable.startDate,
    dueDate: taskTable.dueDate,
    estimatedHours: taskTable.estimatedHours,
    position: taskTable.position,
    createdAt: taskTable.createdAt,
    userId: taskTable.userId,
    assigneeName: userTable.name,
    assigneeId: userTable.id,
    assigneeImage: userTable.image,
    projectId: taskTable.projectId,
    approvalStatus: taskTable.approvalStatus,
    approvalNote: taskTable.approvalNote,
    approvalClientName: taskTable.approvalClientName,
    approvalRespondedAt: taskTable.approvalRespondedAt,
  };

  const query = db
    .select(taskSelection)
    .from(taskTable)
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .leftJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(whereClause)
    .orderBy(orderByClause);

  const paginatedTasks = usePagination
    ? await query.limit(pageSize).offset(offset)
    : await query;

  const taskIds = paginatedTasks.map((task) => task.id);

  const labelsData =
    taskIds.length > 0
      ? await db
          .select({
            id: labelTable.id,
            name: labelTable.name,
            color: labelTable.color,
            taskId: labelTable.taskId,
          })
          .from(labelTable)
          .where(inArray(labelTable.taskId, taskIds))
      : [];

  const externalLinksData =
    taskIds.length > 0
      ? await db
          .select()
          .from(externalLinkTable)
          .where(inArray(externalLinkTable.taskId, taskIds))
      : [];

  const approvalsData =
    taskIds.length > 0
      ? await db
          .select({
            id: taskApprovalTable.id,
            taskId: taskApprovalTable.taskId,
            clientName: taskApprovalTable.clientName,
            status: taskApprovalTable.status,
            note: taskApprovalTable.note,
            respondedAt: taskApprovalTable.respondedAt,
          })
          .from(taskApprovalTable)
          .where(inArray(taskApprovalTable.taskId, taskIds))
          .orderBy(asc(taskApprovalTable.respondedAt))
      : [];

  const taskLabelsMap = new Map<
    string,
    Array<{ id: string; name: string; color: string }>
  >();
  for (const label of labelsData) {
    if (label.taskId) {
      if (!taskLabelsMap.has(label.taskId)) {
        taskLabelsMap.set(label.taskId, []);
      }
      taskLabelsMap.get(label.taskId)?.push({
        id: label.id,
        name: label.name,
        color: label.color,
      });
    }
  }

  const taskExternalLinksMap = new Map<
    string,
    Array<{
      id: string;
      taskId: string;
      integrationId: string;
      resourceType: string;
      externalId: string;
      url: string;
      title: string | null;
      metadata: Record<string, unknown> | null;
    }>
  >();
  for (const externalLink of externalLinksData) {
    if (!taskExternalLinksMap.has(externalLink.taskId)) {
      taskExternalLinksMap.set(externalLink.taskId, []);
    }
    taskExternalLinksMap.get(externalLink.taskId)?.push({
      ...externalLink,
      metadata: externalLink.metadata
        ? JSON.parse(externalLink.metadata)
        : null,
    });
  }

  const taskApprovalsMap = new Map<
    string,
    Array<{
      id: string;
      clientName: string;
      status: string;
      note: string | null;
      respondedAt: Date;
    }>
  >();
  for (const approval of approvalsData) {
    if (!taskApprovalsMap.has(approval.taskId)) {
      taskApprovalsMap.set(approval.taskId, []);
    }
    taskApprovalsMap.get(approval.taskId)?.push({
      id: approval.id,
      clientName: approval.clientName,
      status: approval.status,
      note: approval.note,
      respondedAt: approval.respondedAt,
    });
  }

  const imageAssetsData =
    taskIds.length > 0
      ? await db
          .select({
            id: assetTable.id,
            taskId: assetTable.taskId,
            filename: assetTable.filename,
            versionGroupId: assetTable.versionGroupId,
            versionNumber: assetTable.versionNumber,
            createdAt: assetTable.createdAt,
          })
          .from(assetTable)
          .where(
            and(
              inArray(assetTable.taskId, taskIds),
              eq(assetTable.kind, "image"),
            ),
          )
      : [];

  const apiBaseUrl = normalizeApiServerUrl(
    process.env.KANEO_API_URL || "http://localhost:1337",
  );

  // A "moodboard" gallery shows one thumbnail per render, not one per
  // upload — group by version chain and keep only the latest revision.
  const latestByGroup = new Map<
    string,
    (typeof imageAssetsData)[number] & { groupKey: string }
  >();
  for (const asset of imageAssetsData) {
    const groupKey = asset.versionGroupId ?? asset.id;
    const current = latestByGroup.get(`${asset.taskId}:${groupKey}`);
    if (!current || asset.versionNumber > current.versionNumber) {
      latestByGroup.set(`${asset.taskId}:${groupKey}`, { ...asset, groupKey });
    }
  }

  const latestAssetIds = Array.from(latestByGroup.values()).map(
    (asset) => asset.id,
  );
  const pinsData =
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
  const assetPinsMap = new Map<string, typeof pinsData>();
  for (const pin of pinsData) {
    if (!assetPinsMap.has(pin.assetId)) {
      assetPinsMap.set(pin.assetId, []);
    }
    assetPinsMap.get(pin.assetId)?.push(pin);
  }

  const taskImagesMap = new Map<
    string,
    Array<{
      id: string;
      url: string;
      filename: string;
      versionNumber: number;
      createdAt: Date;
      pins: typeof pinsData;
    }>
  >();
  for (const asset of latestByGroup.values()) {
    if (!asset.taskId) continue;
    if (!taskImagesMap.has(asset.taskId)) {
      taskImagesMap.set(asset.taskId, []);
    }
    taskImagesMap.get(asset.taskId)?.push({
      id: asset.id,
      url: `${apiBaseUrl}/asset/${asset.id}`,
      filename: asset.filename,
      versionNumber: asset.versionNumber,
      createdAt: asset.createdAt,
      pins: assetPinsMap.get(asset.id) || [],
    });
  }
  for (const images of taskImagesMap.values()) {
    images.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const projectColumns = await db
    .select()
    .from(columnTable)
    .where(eq(columnTable.projectId, projectId))
    .orderBy(asc(columnTable.position));

  // Rolled up across every task in the project (not just the current page),
  // so a column's consumed time is correct regardless of pagination.
  const consumedSecondsByStatus = await db
    .select({
      status: taskTable.status,
      consumedSeconds: sql<number>`coalesce(sum(${timeEntryTable.duration}), 0)`,
    })
    .from(timeEntryTable)
    .innerJoin(taskTable, eq(timeEntryTable.taskId, taskTable.id))
    .where(eq(taskTable.projectId, projectId))
    .groupBy(taskTable.status);

  const consumedSecondsMap = new Map(
    consumedSecondsByStatus.map((row) => [
      row.status,
      Number(row.consumedSeconds),
    ]),
  );

  const columns = projectColumns.map((column) => ({
    id: column.slug,
    columnId: column.id,
    slug: column.slug,
    name: column.name,
    icon: column.icon,
    isFinal: column.isFinal,
    budgetHours: column.budgetHours,
    consumedSeconds: consumedSecondsMap.get(column.slug) ?? 0,
    tasks: paginatedTasks
      .filter((task) => task.status === column.slug)
      .map((task) => ({
        ...task,
        labels: taskLabelsMap.get(task.id) || [],
        externalLinks: taskExternalLinksMap.get(task.id) || [],
        approvals: taskApprovalsMap.get(task.id) || [],
        images: taskImagesMap.get(task.id) || [],
      })),
  }));

  const archivedTasks = paginatedTasks
    .filter((task) => task.status === "archived")
    .map((task) => ({
      ...task,
      labels: taskLabelsMap.get(task.id) || [],
      externalLinks: taskExternalLinksMap.get(task.id) || [],
      approvals: taskApprovalsMap.get(task.id) || [],
      images: taskImagesMap.get(task.id) || [],
    }));

  const plannedTasks = paginatedTasks
    .filter((task) => task.status === "planned")
    .map((task) => ({
      ...task,
      labels: taskLabelsMap.get(task.id) || [],
      externalLinks: taskExternalLinksMap.get(task.id) || [],
      approvals: taskApprovalsMap.get(task.id) || [],
      images: taskImagesMap.get(task.id) || [],
    }));

  return {
    data: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      icon: project.icon,
      description: project.description,
      isPublic: project.isPublic,
      workspaceId: project.workspaceId,
      columns,
      archivedTasks,
      plannedTasks,
    },
    pagination: usePagination
      ? {
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        }
      : {
          total,
          page: 1,
          pageSize: total,
          totalPages: 1,
        },
  };
}

export default getTasks;
