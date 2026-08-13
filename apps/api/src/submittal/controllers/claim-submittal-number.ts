import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function claimSubmittalNumber(
  projectId: string,
  dbOrTx: DbOrTx = db,
) {
  const [updated] = await dbOrTx
    .update(projectTable)
    .set({
      lastSubmittalNumber: sql`${projectTable.lastSubmittalNumber} + 1`,
    })
    .where(eq(projectTable.id, projectId))
    .returning({ lastSubmittalNumber: projectTable.lastSubmittalNumber });

  if (!updated) {
    throw new HTTPException(404, {
      message: "Project not found",
    });
  }

  return updated.lastSubmittalNumber;
}
