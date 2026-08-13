import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { permitTable } from "../../database/schema";

async function deletePermit(id: string) {
  const [deleted] = await db
    .delete(permitTable)
    .where(eq(permitTable.id, id))
    .returning();

  if (!deleted) {
    throw new HTTPException(404, { message: "Permit not found" });
  }

  return deleted;
}

export default deletePermit;
