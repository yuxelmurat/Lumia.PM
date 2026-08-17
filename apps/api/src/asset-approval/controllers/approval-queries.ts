import { asc, eq } from "drizzle-orm";
import db from "../../database";
import {
  assetApprovalEventTable,
  assetGuestTable,
  assetTable,
  userTable,
} from "../../database/schema";

type ApprovalActor = {
  type: "user" | "guest";
  id: string;
  name: string | null;
};

function toActor(
  userId: string | null,
  userName: string | null,
  guestId: string | null,
  guestName: string | null,
): ApprovalActor {
  if (userId) return { type: "user", id: userId, name: userName };
  return { type: "guest", id: guestId ?? "unknown", name: guestName ?? null };
}

export async function fetchApprovalEvents(assetId: string) {
  const rows = await db
    .select({
      id: assetApprovalEventTable.id,
      assetId: assetApprovalEventTable.assetId,
      status: assetApprovalEventTable.status,
      note: assetApprovalEventTable.note,
      createdAt: assetApprovalEventTable.createdAt,
      actorUserId: assetApprovalEventTable.actorUserId,
      actorUserName: userTable.name,
      actorGuestId: assetApprovalEventTable.actorGuestId,
      actorGuestName: assetGuestTable.name,
    })
    .from(assetApprovalEventTable)
    .leftJoin(userTable, eq(assetApprovalEventTable.actorUserId, userTable.id))
    .leftJoin(
      assetGuestTable,
      eq(assetApprovalEventTable.actorGuestId, assetGuestTable.id),
    )
    .where(eq(assetApprovalEventTable.assetId, assetId))
    .orderBy(asc(assetApprovalEventTable.createdAt));

  return rows.map((row) => ({
    id: row.id,
    assetId: row.assetId,
    status: row.status as "pending" | "approved" | "changes_requested",
    note: row.note,
    createdAt: row.createdAt,
    actor: toActor(
      row.actorUserId,
      row.actorUserName,
      row.actorGuestId,
      row.actorGuestName,
    ),
  }));
}

export async function fetchAssetApprovalStatus(assetId: string) {
  const [asset] = await db
    .select({ approvalStatus: assetTable.approvalStatus })
    .from(assetTable)
    .where(eq(assetTable.id, assetId))
    .limit(1);

  return asset?.approvalStatus ?? null;
}
