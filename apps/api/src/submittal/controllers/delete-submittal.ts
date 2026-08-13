import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { submittalTable } from "../../database/schema";

async function deleteSubmittal(id: string) {
  const [deleted] = await db
    .delete(submittalTable)
    .where(eq(submittalTable.id, id))
    .returning();

  if (!deleted) {
    throw new HTTPException(404, { message: "Submittal not found" });
  }

  return deleted;
}

export default deleteSubmittal;
