import { and, eq } from "drizzle-orm";
import db from "../../database";
import { userTable, workspaceUserTable } from "../../database/schema";

/** Email of the workspace's owner, used as the PayTR `email` field for
 * server-initiated charges (renewals, seat top-ups) where there's no
 * request-scoped user to take it from. */
export async function getWorkspaceOwnerEmail(
  workspaceId: string,
): Promise<string | null> {
  const [owner] = await db
    .select({ email: userTable.email })
    .from(workspaceUserTable)
    .innerJoin(userTable, eq(userTable.id, workspaceUserTable.userId))
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.role, "owner"),
      ),
    )
    .limit(1);

  return owner?.email ?? null;
}
