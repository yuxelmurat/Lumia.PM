import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { changeOrderTable } from "../../database/schema";
import { publishEvent } from "../../events";
import createNotification from "../../notification/controllers/create-notification";
import { fetchChangeOrderById } from "./change-order-queries";

type UpdateChangeOrderInput = Partial<{
  title: string;
  description: string;
  costImpactCents: number | null;
  hoursImpact: number | null;
  status: "pending_review" | "approved" | "rejected";
  decisionNote: string | null;
}>;

async function updateChangeOrder(
  id: string,
  userId: string,
  input: UpdateChangeOrderInput,
) {
  const existing = await fetchChangeOrderById(id);
  if (!existing) {
    throw new HTTPException(404, { message: "Change order not found" });
  }

  const values: Partial<typeof changeOrderTable.$inferInsert> = {};

  if (input.title !== undefined) values.title = input.title;
  if (input.description !== undefined) values.description = input.description;
  if (input.costImpactCents !== undefined) {
    values.costImpactCents = input.costImpactCents;
  }
  if (input.hoursImpact !== undefined) values.hoursImpact = input.hoursImpact;
  if (input.decisionNote !== undefined)
    values.decisionNote = input.decisionNote;

  if (input.status !== undefined) {
    values.status = input.status;
    if (input.status === "pending_review") {
      values.decidedByUserId = null;
      values.decidedAt = null;
    } else {
      values.decidedByUserId = userId;
      values.decidedAt = new Date();
    }
  }

  const [updated] = await db
    .update(changeOrderTable)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(changeOrderTable.id, id))
    .returning({ id: changeOrderTable.id });

  if (!updated) {
    throw new HTTPException(404, { message: "Change order not found" });
  }

  const changeOrder = await fetchChangeOrderById(id);
  if (!changeOrder) {
    throw new HTTPException(404, { message: "Change order not found" });
  }

  const statusChanged =
    values.status !== undefined && values.status !== existing.status;

  if (statusChanged) {
    await publishEvent("change_order.decided", {
      changeOrderId: changeOrder.id,
      projectId: changeOrder.projectId,
      status: changeOrder.status,
    });

    if (
      changeOrder.status !== "pending_review" &&
      existing.createdByUserId &&
      existing.createdByUserId !== userId
    ) {
      await createNotification({
        userId: existing.createdByUserId,
        type: "change_order_decided",
        title: `CO-${changeOrder.number}: ${changeOrder.title}`,
        content:
          changeOrder.status === "approved"
            ? "Your change order was approved"
            : "Your change order was rejected",
        resourceId: changeOrder.id,
        resourceType: "change_order",
      });
    }
  }

  return changeOrder;
}

export default updateChangeOrder;
