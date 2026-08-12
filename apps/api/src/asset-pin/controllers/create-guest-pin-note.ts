import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { assetPinNoteTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { assertGuestBelongsToShareLink } from "./create-guest-pin";
import { fetchPinById } from "./pin-queries";

async function createGuestPinNote(
  assetId: string,
  pinId: string,
  shareLinkId: string,
  guestId: string,
  content: string,
) {
  await assertGuestBelongsToShareLink(guestId, shareLinkId);

  const pin = await fetchPinById(pinId);
  if (!pin || pin.assetId !== assetId) {
    throw new HTTPException(404, { message: "Pin not found" });
  }

  await db.insert(assetPinNoteTable).values({
    pinId,
    content,
    authorGuestId: guestId,
  });

  await publishEvent("asset.pin.note_created", {
    pinId,
    assetId,
    createdByGuestId: guestId,
  });

  return fetchPinById(pinId);
}

export default createGuestPinNote;
