import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { assetShareLinkTable, assetTable } from "../../database/schema";

export async function resolveShareLink(token: string) {
  const [row] = await db
    .select({
      shareLinkId: assetShareLinkTable.id,
      expiresAt: assetShareLinkTable.expiresAt,
      revokedAt: assetShareLinkTable.revokedAt,
      assetId: assetTable.id,
      filename: assetTable.filename,
      mimeType: assetTable.mimeType,
      kind: assetTable.kind,
    })
    .from(assetShareLinkTable)
    .innerJoin(assetTable, eq(assetShareLinkTable.assetId, assetTable.id))
    .where(eq(assetShareLinkTable.token, token))
    .limit(1);

  if (!row || row.revokedAt) {
    throw new HTTPException(404, { message: "Share link not found" });
  }

  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    throw new HTTPException(410, { message: "Share link has expired" });
  }

  return row;
}
