import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { assetShareLinkTable } from "../../database/schema";
import { publishEvent } from "../../events";

async function revokeShareLink(id: string, userId: string) {
  const [revoked] = await db
    .update(assetShareLinkTable)
    .set({ revokedAt: new Date() })
    .where(eq(assetShareLinkTable.id, id))
    .returning();

  if (!revoked) {
    throw new HTTPException(404, { message: "Share link not found" });
  }

  await publishEvent("asset.share_link.revoked", {
    shareLinkId: id,
    assetId: revoked.assetId,
    revokedByUserId: userId,
  });

  return revoked;
}

export default revokeShareLink;
