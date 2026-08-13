import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { rfiTable } from "../../database/schema";

async function deleteRfi(id: string) {
  const [deleted] = await db
    .delete(rfiTable)
    .where(eq(rfiTable.id, id))
    .returning();

  if (!deleted) {
    throw new HTTPException(404, { message: "RFI not found" });
  }

  return deleted;
}

export default deleteRfi;
