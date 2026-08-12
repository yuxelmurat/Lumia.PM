import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  assetPinNoteTable,
  assetPinTable,
  userTable,
} from "../../database/schema";
import { publishEvent } from "../../events";
import notifyPinCreated from "./notify-pin-created";
import { fetchPinById } from "./pin-queries";

type CreatePinInput = {
  content: string;
  x?: number | null;
  y?: number | null;
  viewerState?: unknown;
  label?: string | null;
};

async function createPin(
  assetId: string,
  userId: string,
  input: CreatePinInput,
) {
  const [pin] = await db
    .insert(assetPinTable)
    .values({
      assetId,
      x: input.x ?? null,
      y: input.y ?? null,
      viewerState: input.viewerState ?? null,
      label: input.label ?? null,
      createdByUserId: userId,
    })
    .returning();

  if (!pin) {
    throw new HTTPException(500, { message: "Failed to create pin" });
  }

  await db.insert(assetPinNoteTable).values({
    pinId: pin.id,
    content: input.content,
    authorUserId: userId,
  });

  await publishEvent("asset.pin.created", {
    pinId: pin.id,
    assetId,
    createdByUserId: userId,
  });

  const [author] = await db
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, userId));
  await notifyPinCreated(assetId, author?.name ?? "A team member", userId);

  return fetchPinById(pin.id);
}

export default createPin;
