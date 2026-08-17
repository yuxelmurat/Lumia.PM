import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  assetGuestTable,
  assetPinNoteTable,
  assetPinTable,
} from "../../database/schema";
import { publishEvent } from "../../events";
import notifyPinCreated from "./notify-pin-created";
import { fetchPinById } from "./pin-queries";

export async function assertGuestBelongsToShareLink(
  guestId: string,
  shareLinkId: string,
) {
  const [guest] = await db
    .select({ id: assetGuestTable.id, name: assetGuestTable.name })
    .from(assetGuestTable)
    .where(
      and(
        eq(assetGuestTable.id, guestId),
        eq(assetGuestTable.shareLinkId, shareLinkId),
      ),
    )
    .limit(1);

  if (!guest) {
    throw new HTTPException(403, {
      message: "Invalid guest for this share link",
    });
  }

  return guest;
}

type CreateGuestPinInput = {
  content: string;
  x?: number | null;
  y?: number | null;
  viewerState?: unknown;
  label?: string | null;
};

async function createGuestPin(
  assetId: string,
  shareLinkId: string,
  guestId: string,
  input: CreateGuestPinInput,
) {
  const guest = await assertGuestBelongsToShareLink(guestId, shareLinkId);

  const [pin] = await db
    .insert(assetPinTable)
    .values({
      assetId,
      x: input.x ?? null,
      y: input.y ?? null,
      viewerState: input.viewerState ?? null,
      label: input.label ?? null,
      createdByGuestId: guestId,
    })
    .returning();

  if (!pin) {
    throw new HTTPException(500, { message: "Failed to create pin" });
  }

  await db.insert(assetPinNoteTable).values({
    pinId: pin.id,
    content: input.content,
    authorGuestId: guestId,
  });

  await publishEvent("asset.pin.created", {
    pinId: pin.id,
    assetId,
    createdByGuestId: guestId,
  });

  await notifyPinCreated(
    assetId,
    guest.name ? `${guest.name} (client)` : "A client",
  );

  return fetchPinById(pin.id);
}

export default createGuestPin;
