import { desc, eq } from "drizzle-orm";
import db from "../../database";
import { assetShareLinkTable } from "../../database/schema";

async function listShareLinks(assetId: string) {
  return db
    .select()
    .from(assetShareLinkTable)
    .where(eq(assetShareLinkTable.assetId, assetId))
    .orderBy(desc(assetShareLinkTable.createdAt));
}

export default listShareLinks;
