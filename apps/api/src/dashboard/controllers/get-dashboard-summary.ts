import { and, asc, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import db from "../../database";
import {
  activityTable,
  columnTable,
  projectTable,
  taskTable,
  userTable,
} from "../../database/schema";

export type DashboardStatusCount = {
  status: string;
  count: number;
};

export type DashboardOverdueTask = {
  id: string;
  number: number;
  title: string;
  projectId: string;
  projectName: string;
  dueDate: Date;
  assigneeName: string | null;
};

export type DashboardActivityItem = {
  id: string;
  type: string;
  content: string | null;
  createdAt: Date;
  userName: string | null;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
};

export type DashboardSummary = {
  statusCounts: DashboardStatusCount[];
  overdueTasks: DashboardOverdueTask[];
  recentActivity: DashboardActivityItem[];
};

const OVERDUE_LIMIT = 10;
const ACTIVITY_LIMIT = 15;

async function getStatusCounts(
  workspaceId: string,
): Promise<DashboardStatusCount[]> {
  const rows = await db
    .select({
      status: taskTable.status,
      count: sql<number>`count(*)`,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        isNull(projectTable.archivedAt),
      ),
    )
    .groupBy(taskTable.status);

  return rows.map((row) => ({
    status: row.status,
    count: Number(row.count),
  }));
}

async function getOverdueTasks(
  workspaceId: string,
  now: Date,
): Promise<DashboardOverdueTask[]> {
  const rows = await db
    .select({
      id: taskTable.id,
      number: taskTable.number,
      title: taskTable.title,
      dueDate: taskTable.dueDate,
      projectId: projectTable.id,
      projectName: projectTable.name,
      assigneeName: userTable.name,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .leftJoin(columnTable, eq(taskTable.columnId, columnTable.id))
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        isNull(projectTable.archivedAt),
        lt(taskTable.dueDate, now),
        or(isNull(columnTable.isFinal), eq(columnTable.isFinal, false)),
      ),
    )
    .orderBy(asc(taskTable.dueDate))
    .limit(OVERDUE_LIMIT);

  return rows
    .filter(
      (row): row is typeof row & { dueDate: Date } => row.dueDate !== null,
    )
    .map((row) => ({
      id: row.id,
      number: row.number ?? 0,
      title: row.title,
      projectId: row.projectId,
      projectName: row.projectName,
      dueDate: row.dueDate,
      assigneeName: row.assigneeName,
    }));
}

async function getRecentActivity(
  workspaceId: string,
): Promise<DashboardActivityItem[]> {
  return db
    .select({
      id: activityTable.id,
      type: activityTable.type,
      content: activityTable.content,
      createdAt: activityTable.createdAt,
      userName: userTable.name,
      taskId: taskTable.id,
      taskTitle: taskTable.title,
      projectId: projectTable.id,
      projectName: projectTable.name,
    })
    .from(activityTable)
    .innerJoin(taskTable, eq(activityTable.taskId, taskTable.id))
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .leftJoin(userTable, eq(activityTable.userId, userTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        isNull(projectTable.archivedAt),
      ),
    )
    .orderBy(desc(activityTable.createdAt))
    .limit(ACTIVITY_LIMIT);
}

async function getDashboardSummary(
  workspaceId: string,
): Promise<DashboardSummary> {
  const now = new Date();
  const [statusCounts, overdueTasks, recentActivity] = await Promise.all([
    getStatusCounts(workspaceId),
    getOverdueTasks(workspaceId, now),
    getRecentActivity(workspaceId),
  ]);

  return { statusCounts, overdueTasks, recentActivity };
}

export default getDashboardSummary;
