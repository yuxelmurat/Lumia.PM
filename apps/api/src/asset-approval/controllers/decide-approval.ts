import { eq } from "drizzle-orm";
import db from "../../database";
import {
  assetApprovalEventTable,
  assetTable,
  userTable,
} from "../../database/schema";
import { publishEvent } from "../../events";
import { fetchApprovalEvents } from "./approval-queries";
import notifyApprovalEvent from "./notify-approval-event";

type Decision = "approved" | "changes_requested";

async function decideApproval(
  assetId: string,
  userId: string,
  decision: Decision,
  note?: string,
) {
  await db
    .update(assetTable)
    .set({ approvalStatus: decision })
    .where(eq(assetTable.id, assetId));

  await db.insert(assetApprovalEventTable).values({
    assetId,
    status: decision,
    actorUserId: userId,
    note: note ?? null,
  });

  await publishEvent("asset.approval.decided", {
    assetId,
    decision,
    decidedByUserId: userId,
  });

  const [actor] = await db
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, userId));
  await notifyApprovalEvent(
    assetId,
    decision,
    actor?.name ?? "A team member",
    userId,
  );

  return fetchApprovalEvents(assetId);
}

export default decideApproval;
