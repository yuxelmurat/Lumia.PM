import { and, eq, sql } from "drizzle-orm";
import db from "../../database";
import { assetPinTable, assetTable } from "../../database/schema";

async function countOpenPunchItems(projectId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(assetPinTable)
    .innerJoin(assetTable, eq(assetPinTable.assetId, assetTable.id))
    .where(
      and(
        eq(assetTable.projectId, projectId),
        eq(assetPinTable.isPunchItem, true),
        eq(assetPinTable.status, "open"),
      ),
    );

  return Number(row?.count ?? 0);
}

export default countOpenPunchItems;
