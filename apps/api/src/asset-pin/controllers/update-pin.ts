import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { assetPinTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { fetchPinById } from "./pin-queries";

type UpdatePinInput = {
  status?: "open" | "resolved";
  isPunchItem?: boolean;
  assigneeUserId?: string | null;
  dueDate?: string | null;
};

async function updatePin(pinId: string, userId: string, input: UpdatePinInput) {
  const values: Partial<typeof assetPinTable.$inferInsert> = {};

  if (input.status !== undefined) {
    values.status = input.status;
    values.resolvedAt = input.status === "resolved" ? new Date() : null;
    values.resolvedByUserId = input.status === "resolved" ? userId : null;
  }
  if (input.isPunchItem !== undefined) {
    values.isPunchItem = input.isPunchItem;
  }
  if (input.assigneeUserId !== undefined) {
    values.assigneeUserId = input.assigneeUserId;
  }
  if (input.dueDate !== undefined) {
    values.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  const [updated] = await db
    .update(assetPinTable)
    .set(values)
    .where(eq(assetPinTable.id, pinId))
    .returning({ id: assetPinTable.id, assetId: assetPinTable.assetId });

  if (!updated) {
    throw new HTTPException(404, { message: "Pin not found" });
  }

  if (input.status !== undefined) {
    await publishEvent(
      input.status === "resolved" ? "asset.pin.resolved" : "asset.pin.reopened",
      { pinId, assetId: updated.assetId, byUserId: userId },
    );
  }
  if (input.assigneeUserId !== undefined) {
    await publishEvent("asset.pin.punch_assigned", {
      pinId,
      assetId: updated.assetId,
      byUserId: userId,
      assigneeUserId: input.assigneeUserId,
    });
  }

  return fetchPinById(pinId);
}

export default updatePin;
