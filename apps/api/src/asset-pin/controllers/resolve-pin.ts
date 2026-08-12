import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { assetPinTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { fetchPinById } from "./pin-queries";

async function resolvePin(
  pinId: string,
  userId: string,
  status: "open" | "resolved",
) {
  const [updated] = await db
    .update(assetPinTable)
    .set(
      status === "resolved"
        ? { status, resolvedAt: new Date(), resolvedByUserId: userId }
        : { status, resolvedAt: null, resolvedByUserId: null },
    )
    .where(eq(assetPinTable.id, pinId))
    .returning({ id: assetPinTable.id, assetId: assetPinTable.assetId });

  if (!updated) {
    throw new HTTPException(404, { message: "Pin not found" });
  }

  await publishEvent(
    status === "resolved" ? "asset.pin.resolved" : "asset.pin.reopened",
    { pinId, assetId: updated.assetId, byUserId: userId },
  );

  return fetchPinById(pinId);
}

export default resolvePin;
