import { eq } from "drizzle-orm";
import db from "../../database";
import { assetTable, userTable } from "../../database/schema";

const MAX_CHAIN_STEPS = 50;

type RevisionRow = {
  id: string;
  filename: string;
  createdAt: Date;
  createdByUserId: string | null;
  createdByUserName: string | null;
  approvalStatus: string | null;
  supersedesAssetId: string | null;
};

const revisionColumns = {
  id: assetTable.id,
  filename: assetTable.filename,
  createdAt: assetTable.createdAt,
  createdByUserId: assetTable.createdBy,
  createdByUserName: userTable.name,
  approvalStatus: assetTable.approvalStatus,
  supersedesAssetId: assetTable.supersedesAssetId,
};

async function fetchAssetRow(assetId: string): Promise<RevisionRow | null> {
  const [row] = await db
    .select(revisionColumns)
    .from(assetTable)
    .leftJoin(userTable, eq(assetTable.createdBy, userTable.id))
    .where(eq(assetTable.id, assetId))
    .limit(1);

  return row ?? null;
}

async function fetchNextRevision(
  supersedesAssetId: string,
): Promise<RevisionRow | null> {
  const [row] = await db
    .select(revisionColumns)
    .from(assetTable)
    .leftJoin(userTable, eq(assetTable.createdBy, userTable.id))
    .where(eq(assetTable.supersedesAssetId, supersedesAssetId))
    .limit(1);

  return row ?? null;
}

export async function fetchAssetRevisionChain(assetId: string) {
  const startAsset = await fetchAssetRow(assetId);
  if (!startAsset) return [];

  let root = startAsset;
  for (let step = 0; step < MAX_CHAIN_STEPS; step += 1) {
    if (!root.supersedesAssetId) break;
    const previous = await fetchAssetRow(root.supersedesAssetId);
    if (!previous) break;
    root = previous;
  }

  const chain: RevisionRow[] = [root];
  let cursor = root;
  for (let step = 0; step < MAX_CHAIN_STEPS; step += 1) {
    const next = await fetchNextRevision(cursor.id);
    if (!next) break;
    chain.push(next);
    cursor = next;
  }

  return chain.map((asset, index) => ({
    id: asset.id,
    filename: asset.filename,
    createdAt: asset.createdAt,
    createdByUserId: asset.createdByUserId,
    createdByUserName: asset.createdByUserName,
    approvalStatus: asset.approvalStatus as
      | "pending"
      | "approved"
      | "changes_requested"
      | null,
    revisionNumber: index + 1,
  }));
}
