import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { assertGuestBelongsToShareLink } from "../../asset-pin/controllers/create-guest-pin";
import db from "../../database";
import { assetApprovalEventTable, assetTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { fetchApprovalEvents } from "./approval-queries";
import notifyApprovalEvent from "./notify-approval-event";

type Decision = "approved" | "changes_requested";

async function decideApprovalAsGuest(
  assetId: string,
  shareLinkId: string,
  guestId: string,
  decision: Decision,
  note?: string,
) {
  const guest = await assertGuestBelongsToShareLink(guestId, shareLinkId);

  const [asset] = await db
    .select({ approvalStatus: assetTable.approvalStatus })
    .from(assetTable)
    .where(eq(assetTable.id, assetId))
    .limit(1);

  if (!asset) {
    throw new HTTPException(404, { message: "Asset not found" });
  }

  if (asset.approvalStatus !== "pending") {
    throw new HTTPException(400, {
      message: "This asset is not currently pending approval",
    });
  }

  await db
    .update(assetTable)
    .set({ approvalStatus: decision })
    .where(eq(assetTable.id, assetId));

  await db.insert(assetApprovalEventTable).values({
    assetId,
    status: decision,
    actorGuestId: guestId,
    note: note ?? null,
  });

  await publishEvent("asset.approval.decided", {
    assetId,
    decision,
    decidedByGuestId: guestId,
  });

  await notifyApprovalEvent(
    assetId,
    decision,
    guest.name ? `${guest.name} (client)` : "A client",
  );

  return fetchApprovalEvents(assetId);
}

export default decideApprovalAsGuest;
