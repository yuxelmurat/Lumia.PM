import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { productSpecTable } from "../../database/schema";

async function deleteProductSpec(id: string) {
  const [deleted] = await db
    .delete(productSpecTable)
    .where(eq(productSpecTable.id, id))
    .returning();

  if (!deleted) {
    throw new HTTPException(404, { message: "Product spec not found" });
  }

  return deleted;
}

export default deleteProductSpec;
