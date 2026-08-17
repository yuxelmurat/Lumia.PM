import { asc, eq } from "drizzle-orm";
import db from "../../database";
import { productSpecTable } from "../../database/schema";

async function listProductSpecs(projectId: string) {
  return db
    .select()
    .from(productSpecTable)
    .where(eq(productSpecTable.projectId, projectId))
    .orderBy(asc(productSpecTable.createdAt));
}

export default listProductSpecs;
