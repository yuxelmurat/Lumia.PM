import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function claimPermitNumber(
  projectId: string,
  dbOrTx: DbOrTx = db,
) {
  const [updated] = await dbOrTx
    .update(projectTable)
    .set({
      lastPermitNumber: sql`${projectTable.lastPermitNumber} + 1`,
    })
    .where(eq(projectTable.id, projectId))
    .returning({ lastPermitNumber: projectTable.lastPermitNumber });

  if (!updated) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  return updated.lastPermitNumber;
}
