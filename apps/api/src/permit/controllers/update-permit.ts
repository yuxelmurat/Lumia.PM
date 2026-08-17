import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { permitTable } from "../../database/schema";
import { publishEvent } from "../../events";
import createNotification from "../../notification/controllers/create-notification";
import { fetchPermitById } from "./permit-queries";

type UpdatePermitInput = Partial<{
  jurisdictionName: string;
  permitType: string | null;
  status:
    | "not_submitted"
    | "submitted"
    | "corrections_required"
    | "approved"
    | "issued";
  permitNumber: string | null;
  submittedDate: string | null;
  approvalDate: string | null;
  notes: string | null;
  assigneeUserId: string | null;
}>;

async function updatePermit(
  id: string,
  userId: string,
  input: UpdatePermitInput,
) {
  const existing = await fetchPermitById(id);
  if (!existing) {
    throw new HTTPException(404, { message: "Permit not found" });
  }

  const { submittedDate, approvalDate, ...rest } = input;

  await db
    .update(permitTable)
    .set({
      ...rest,
      ...(submittedDate !== undefined && {
        submittedDate: submittedDate ? new Date(submittedDate) : null,
      }),
      ...(approvalDate !== undefined && {
        approvalDate: approvalDate ? new Date(approvalDate) : null,
      }),
      updatedAt: new Date(),
    })
    .where(eq(permitTable.id, id));

  const updated = await fetchPermitById(id);
  if (!updated) {
    throw new HTTPException(500, { message: "Failed to update permit" });
  }

  if (input.status && input.status !== existing.status) {
    await publishEvent("permit.status_changed", {
      permitId: updated.id,
      projectId: updated.projectId,
      oldStatus: existing.status,
      newStatus: updated.status,
    });

    if (updated.assignee && updated.assignee.id !== userId) {
      await createNotification({
        userId: updated.assignee.id,
        type: "permit_status_changed",
        title: `PMT-${updated.number}: ${updated.jurisdictionName}`,
        content: `Status changed to ${updated.status.replace(/_/g, " ")}`,
        resourceId: updated.id,
        resourceType: "permit",
      });
    }
  }

  return updated;
}

export default updatePermit;
