import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { submittalTable } from "../../database/schema";
import { publishEvent } from "../../events";
import createNotification from "../../notification/controllers/create-notification";
import { fetchSubmittalById } from "./submittal-queries";

type UpdateSubmittalInput = Partial<{
  title: string;
  specSection: string | null;
  description: string;
  assigneeUserId: string | null;
  dueDate: string | null;
  status: "open" | "approved" | "revise_resubmit" | "closed";
  reviewNote: string | null;
}>;

async function updateSubmittal(
  id: string,
  userId: string,
  input: UpdateSubmittalInput,
) {
  const existing = await fetchSubmittalById(id);
  if (!existing) {
    throw new HTTPException(404, { message: "Submittal not found" });
  }

  const values: Partial<typeof submittalTable.$inferInsert> = {};

  if (input.title !== undefined) values.title = input.title;
  if (input.specSection !== undefined) values.specSection = input.specSection;
  if (input.description !== undefined) values.description = input.description;
  if (input.assigneeUserId !== undefined) {
    values.assigneeUserId = input.assigneeUserId;
  }
  if (input.dueDate !== undefined) {
    values.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.reviewNote !== undefined) values.reviewNote = input.reviewNote;

  if (input.status !== undefined) {
    values.status = input.status;
    if (input.status === "approved" || input.status === "revise_resubmit") {
      values.reviewedByUserId = userId;
      values.reviewedAt = new Date();
    } else {
      values.reviewedByUserId = null;
      values.reviewedAt = null;
    }
  }

  const [updated] = await db
    .update(submittalTable)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(submittalTable.id, id))
    .returning({ id: submittalTable.id });

  if (!updated) {
    throw new HTTPException(404, { message: "Submittal not found" });
  }

  const submittal = await fetchSubmittalById(id);
  if (!submittal) {
    throw new HTTPException(404, { message: "Submittal not found" });
  }

  const statusChanged =
    values.status !== undefined && values.status !== existing.status;

  if (statusChanged) {
    await publishEvent("submittal.status_changed", {
      submittalId: submittal.id,
      projectId: submittal.projectId,
      status: submittal.status,
    });

    if (
      (submittal.status === "approved" ||
        submittal.status === "revise_resubmit") &&
      existing.createdByUserId &&
      existing.createdByUserId !== userId
    ) {
      await createNotification({
        userId: existing.createdByUserId,
        type: "submittal_reviewed",
        title: `SUB-${submittal.number}: ${submittal.title}`,
        content:
          submittal.status === "approved"
            ? "Your submittal was approved"
            : "Your submittal needs revision and resubmittal",
        resourceId: submittal.id,
        resourceType: "submittal",
      });
    }
  }

  return submittal;
}

export default updateSubmittal;
