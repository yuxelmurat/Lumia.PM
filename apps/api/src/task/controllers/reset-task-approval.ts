import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskApprovalTable, taskTable } from "../../database/schema";
import { publishEvent } from "../../events";

async function resetTaskApproval(id: string) {
  const existingTask = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, id),
  });

  if (!existingTask) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  const [updatedTask] = await db
    .update(taskTable)
    .set({
      approvalStatus: null,
      approvalNote: null,
      approvalClientName: null,
      approvalRespondedAt: null,
    })
    .where(eq(taskTable.id, id))
    .returning();

  if (!updatedTask) {
    throw new HTTPException(500, {
      message: "Failed to reset task approval",
    });
  }

  await db.delete(taskApprovalTable).where(eq(taskApprovalTable.taskId, id));

  await publishEvent("task.approval_updated", {
    taskId: updatedTask.id,
    projectId: updatedTask.projectId,
    status: null,
    clientName: null,
    note: null,
    title: updatedTask.title,
    assigneeId: updatedTask.userId,
    type: "approval_updated",
  });

  return updatedTask;
}

export default resetTaskApproval;
