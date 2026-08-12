import { randomBytes } from "node:crypto";
import db from "../../database";
import { assetShareLinkTable } from "../../database/schema";
import { publishEvent } from "../../events";

function generateToken() {
  return randomBytes(24).toString("base64url");
}

async function createShareLink(
  assetId: string,
  userId: string,
  expiresAt?: Date | null,
) {
  const [link] = await db
    .insert(assetShareLinkTable)
    .values({
      assetId,
      token: generateToken(),
      createdByUserId: userId,
      expiresAt: expiresAt ?? null,
    })
    .returning();

  await publishEvent("asset.share_link.created", {
    shareLinkId: link?.id,
    assetId,
    createdByUserId: userId,
  });

  return link;
}

export default createShareLink;
