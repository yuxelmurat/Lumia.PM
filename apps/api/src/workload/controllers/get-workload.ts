import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import db from "../../database";
import {
  columnTable,
  projectTable,
  taskTable,
  userTable,
} from "../../database/schema";

function startOfWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

type WorkloadWeek = {
  weekStart: string;
  totalHours: number;
  taskCount: number;
};

type WorkloadRow = {
  userId: string;
  userName: string | null;
  weeks: WorkloadWeek[];
};

async function getWorkload(workspaceId: string, from: Date, to: Date) {
  const rows = await db
    .select({
      userId: taskTable.userId,
      userName: userTable.name,
      dueDate: taskTable.dueDate,
      estimatedHours: taskTable.estimatedHours,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .leftJoin(columnTable, eq(taskTable.columnId, columnTable.id))
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        isNull(projectTable.archivedAt),
        or(isNull(columnTable.isFinal), eq(columnTable.isFinal, false)),
        gte(taskTable.dueDate, from),
        lte(taskTable.dueDate, to),
      ),
    );

  const byUser = new Map<string, WorkloadRow>();
  const weekKeys = new Set<string>();

  for (const row of rows) {
    if (!row.userId || !row.dueDate) continue;

    const weekStart = startOfWeek(new Date(row.dueDate))
      .toISOString()
      .slice(0, 10);
    weekKeys.add(weekStart);

    let user = byUser.get(row.userId);
    if (!user) {
      user = { userId: row.userId, userName: row.userName, weeks: [] };
      byUser.set(row.userId, user);
    }

    let week = user.weeks.find((w) => w.weekStart === weekStart);
    if (!week) {
      week = { weekStart, totalHours: 0, taskCount: 0 };
      user.weeks.push(week);
    }

    week.totalHours += row.estimatedHours ?? 0;
    week.taskCount += 1;
  }

  const sortedWeeks = Array.from(weekKeys).sort();

  return Array.from(byUser.values())
    .map((user) => ({
      ...user,
      weeks: sortedWeeks.map(
        (weekStart) =>
          user.weeks.find((w) => w.weekStart === weekStart) ?? {
            weekStart,
            totalHours: 0,
            taskCount: 0,
          },
      ),
    }))
    .sort((a, b) => (a.userName ?? "").localeCompare(b.userName ?? ""));
}

export default getWorkload;
