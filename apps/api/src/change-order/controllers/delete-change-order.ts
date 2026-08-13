import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { changeOrderTable } from "../../database/schema";

async function deleteChangeOrder(id: string) {
  const [deleted] = await db
    .delete(changeOrderTable)
    .where(eq(changeOrderTable.id, id))
    .returning();

  if (!deleted) {
    throw new HTTPException(404, { message: "Change order not found" });
  }

  return deleted;
}

export default deleteChangeOrder;
