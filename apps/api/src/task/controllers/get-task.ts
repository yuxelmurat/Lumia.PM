import { asc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskApprovalTable, taskTable, userTable } from "../../database/schema";

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

  return { ...task[0], approvals };
}

export default getTask;
