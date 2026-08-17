import { eq } from "drizzle-orm";
import db from "../../database";
import { assetApprovalEventTable, assetTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { fetchApprovalEvents } from "./approval-queries";

async function requestApproval(assetId: string, userId: string) {
  await db
    .update(assetTable)
    .set({ approvalStatus: "pending" })
    .where(eq(assetTable.id, assetId));

  await db.insert(assetApprovalEventTable).values({
    assetId,
    status: "pending",
    actorUserId: userId,
  });

  await publishEvent("asset.approval.requested", {
    assetId,
    requestedByUserId: userId,
  });

  return fetchApprovalEvents(assetId);
}

export default requestApproval;
