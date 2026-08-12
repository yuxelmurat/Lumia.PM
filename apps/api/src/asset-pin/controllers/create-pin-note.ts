import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { assetPinNoteTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { fetchPinById } from "./pin-queries";

async function createPinNote(pinId: string, userId: string, content: string) {
  const pin = await fetchPinById(pinId);
  if (!pin) {
    throw new HTTPException(404, { message: "Pin not found" });
  }

  await db.insert(assetPinNoteTable).values({
    pinId,
    content,
    authorUserId: userId,
  });

  await publishEvent("asset.pin.note_created", {
    pinId,
    assetId: pin.assetId,
    createdByUserId: userId,
  });

  return fetchPinById(pinId);
}

export default createPinNote;
