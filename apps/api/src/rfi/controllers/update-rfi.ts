import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { rfiTable } from "../../database/schema";
import { publishEvent } from "../../events";
import createNotification from "../../notification/controllers/create-notification";
import { fetchRfiById } from "./rfi-queries";

type UpdateRfiInput = Partial<{
  subject: string;
  question: string;
  assigneeUserId: string | null;
  dueDate: string | null;
  answer: string;
  status: "open" | "answered" | "closed";
}>;

async function updateRfi(id: string, userId: string, input: UpdateRfiInput) {
  const existing = await fetchRfiById(id);
  if (!existing) {
    throw new HTTPException(404, { message: "RFI not found" });
  }

  const values: Partial<typeof rfiTable.$inferInsert> = {};

  if (input.subject !== undefined) values.subject = input.subject;
  if (input.question !== undefined) values.question = input.question;
  if (input.assigneeUserId !== undefined) {
    values.assigneeUserId = input.assigneeUserId;
  }
  if (input.dueDate !== undefined) {
    values.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  if (input.answer !== undefined) {
    values.answer = input.answer;
    if (input.status === undefined) {
      values.status = "answered";
      values.answeredByUserId = userId;
      values.answeredAt = new Date();
    }
  }

  if (input.status !== undefined) {
    values.status = input.status;
    if (input.status === "answered") {
      values.answeredByUserId = userId;
      values.answeredAt = new Date();
    } else {
      values.answeredByUserId = null;
      values.answeredAt = null;
    }
  }

  const [updated] = await db
    .update(rfiTable)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(rfiTable.id, id))
    .returning({ id: rfiTable.id });

  if (!updated) {
    throw new HTTPException(404, { message: "RFI not found" });
  }

  const rfi = await fetchRfiById(id);
  if (!rfi) {
    throw new HTTPException(404, { message: "RFI not found" });
  }

  const statusChanged =
    values.status !== undefined && values.status !== existing.status;
  const assigneeChanged =
    values.assigneeUserId !== undefined &&
    values.assigneeUserId !== existing.assignee?.id;

  if (statusChanged || values.answer !== undefined) {
    await publishEvent("rfi.status_changed", {
      rfiId: rfi.id,
      projectId: rfi.projectId,
      status: rfi.status,
    });
  }

  if (
    rfi.status === "answered" &&
    statusChanged &&
    existing.createdByUserId &&
    existing.createdByUserId !== userId
  ) {
    await createNotification({
      userId: existing.createdByUserId,
      type: "rfi_answered",
      title: `RFI-${rfi.number}: ${rfi.subject}`,
      content: "Your RFI was answered",
      resourceId: rfi.id,
      resourceType: "rfi",
    });
  }

  if (assigneeChanged && rfi.assignee && rfi.assignee.id !== userId) {
    await createNotification({
      userId: rfi.assignee.id,
      type: "rfi_assigned",
      title: `RFI-${rfi.number}: ${rfi.subject}`,
      content: "You were assigned an RFI",
      resourceId: rfi.id,
      resourceType: "rfi",
    });
  }

  return rfi;
}

export default updateRfi;
