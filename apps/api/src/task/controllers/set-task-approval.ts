import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { taskApprovalTable, taskTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { resolvePublicProject } from "../../utils/resolve-public-project";

const VALID_APPROVAL_STATUSES = ["approved", "changes_requested"] as const;
type ApprovalStatus = (typeof VALID_APPROVAL_STATUSES)[number];

const MAX_CLIENT_NAME_LENGTH = 100;
const MAX_NOTE_LENGTH = 2000;

async function setTaskApproval({
  token,
  taskId,
  status,
  clientName,
  note,
}: {
  token: string;
  taskId: string;
  status: string;
  clientName: string;
  note?: string;
}) {
  if (!VALID_APPROVAL_STATUSES.includes(status as ApprovalStatus)) {
    throw new HTTPException(400, {
      message: `status must be one of: ${VALID_APPROVAL_STATUSES.join(", ")}`,
    });
  }

  const trimmedClientName = clientName?.trim() ?? "";
  if (trimmedClientName.length === 0) {
    throw new HTTPException(400, {
      message: "clientName is required",
    });
  }
  if (trimmedClientName.length > MAX_CLIENT_NAME_LENGTH) {
    throw new HTTPException(400, {
      message: `clientName must be at most ${MAX_CLIENT_NAME_LENGTH} characters`,
    });
  }

  const trimmedNote = note?.trim();
  if (trimmedNote && trimmedNote.length > MAX_NOTE_LENGTH) {
    throw new HTTPException(400, {
      message: `note must be at most ${MAX_NOTE_LENGTH} characters`,
    });
  }

  // Validates the link itself (exists, public, not expired) before ever
  // touching the task, same as the read route.
  const project = await resolvePublicProject(token);

  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, taskId),
  });

  if (!task || task.projectId !== project.id) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  const [updatedTask] = await db
    .update(taskTable)
    .set({
      approvalStatus: status,
      approvalNote: trimmedNote || null,
      approvalClientName: trimmedClientName,
      approvalRespondedAt: new Date(),
    })
    .where(eq(taskTable.id, taskId))
    .returning();

  if (!updatedTask) {
    throw new HTTPException(500, {
      message: "Failed to update task approval",
    });
  }

  // A second stakeholder's response is a distinct row keyed by name, not an
  // overwrite of the first — the same name responding again (e.g. revising
  // their note) updates their own row in place.
  const respondedAt = updatedTask.approvalRespondedAt ?? new Date();
  await db
    .insert(taskApprovalTable)
    .values({
      taskId,
      clientName: trimmedClientName,
      status,
      note: trimmedNote || null,
      respondedAt,
    })
    .onConflictDoUpdate({
      target: [taskApprovalTable.taskId, taskApprovalTable.clientName],
      set: {
        status,
        note: trimmedNote || null,
        respondedAt,
      },
    });

  await publishEvent("task.approval_updated", {
    taskId: updatedTask.id,
    projectId: updatedTask.projectId,
    status,
    clientName: trimmedClientName,
    note: trimmedNote || null,
    title: updatedTask.title,
    assigneeId: updatedTask.userId,
    type: "approval_updated",
  });

  return updatedTask;
}

export default setTaskApproval;
