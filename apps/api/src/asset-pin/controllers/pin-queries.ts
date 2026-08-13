import { asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import db from "../../database";
import {
  assetGuestTable,
  assetPinNoteTable,
  assetPinTable,
  userTable,
} from "../../database/schema";

const assigneeUserTable = alias(userTable, "assigneeUser");

type PinAuthor = { type: "user" | "guest"; id: string; name: string | null };

function toAuthor(
  userId: string | null,
  userName: string | null,
  guestId: string | null,
  guestName: string | null,
): PinAuthor {
  if (userId) return { type: "user", id: userId, name: userName };
  return { type: "guest", id: guestId ?? "unknown", name: guestName ?? null };
}

const pinColumns = {
  id: assetPinTable.id,
  assetId: assetPinTable.assetId,
  x: assetPinTable.x,
  y: assetPinTable.y,
  viewerState: assetPinTable.viewerState,
  status: assetPinTable.status,
  label: assetPinTable.label,
  createdAt: assetPinTable.createdAt,
  resolvedAt: assetPinTable.resolvedAt,
  createdByUserId: assetPinTable.createdByUserId,
  createdByUserName: userTable.name,
  createdByGuestId: assetPinTable.createdByGuestId,
  createdByGuestName: assetGuestTable.name,
  isPunchItem: assetPinTable.isPunchItem,
  dueDate: assetPinTable.dueDate,
  assigneeUserId: assetPinTable.assigneeUserId,
  assigneeUserName: assigneeUserTable.name,
};

async function fetchNotesForPins(pinIds: string[]) {
  if (pinIds.length === 0) return [];

  return db
    .select({
      id: assetPinNoteTable.id,
      pinId: assetPinNoteTable.pinId,
      content: assetPinNoteTable.content,
      createdAt: assetPinNoteTable.createdAt,
      authorUserId: assetPinNoteTable.authorUserId,
      authorUserName: userTable.name,
      authorGuestId: assetPinNoteTable.authorGuestId,
      authorGuestName: assetGuestTable.name,
    })
    .from(assetPinNoteTable)
    .leftJoin(userTable, eq(assetPinNoteTable.authorUserId, userTable.id))
    .leftJoin(
      assetGuestTable,
      eq(assetPinNoteTable.authorGuestId, assetGuestTable.id),
    )
    .where(inArray(assetPinNoteTable.pinId, pinIds))
    .orderBy(asc(assetPinNoteTable.createdAt));
}

function shapePin(
  pin: {
    id: string;
    assetId: string;
    x: number | null;
    y: number | null;
    viewerState: unknown;
    status: string;
    label: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
    createdByUserId: string | null;
    createdByUserName: string | null;
    createdByGuestId: string | null;
    createdByGuestName: string | null;
    isPunchItem: boolean;
    dueDate: Date | null;
    assigneeUserId: string | null;
    assigneeUserName: string | null;
  },
  notes: Awaited<ReturnType<typeof fetchNotesForPins>>,
) {
  return {
    id: pin.id,
    assetId: pin.assetId,
    x: pin.x,
    y: pin.y,
    viewerState: pin.viewerState,
    status: pin.status as "open" | "resolved",
    label: pin.label,
    createdAt: pin.createdAt,
    resolvedAt: pin.resolvedAt,
    isPunchItem: pin.isPunchItem,
    dueDate: pin.dueDate,
    assignee: pin.assigneeUserId
      ? { id: pin.assigneeUserId, name: pin.assigneeUserName }
      : null,
    author: toAuthor(
      pin.createdByUserId,
      pin.createdByUserName,
      pin.createdByGuestId,
      pin.createdByGuestName,
    ),
    notes: notes
      .filter((note) => note.pinId === pin.id)
      .map((note) => ({
        id: note.id,
        pinId: note.pinId,
        content: note.content,
        createdAt: note.createdAt,
        author: toAuthor(
          note.authorUserId,
          note.authorUserName,
          note.authorGuestId,
          note.authorGuestName,
        ),
      })),
  };
}

export async function fetchPinsByAssetId(assetId: string) {
  const pinRows = await db
    .select(pinColumns)
    .from(assetPinTable)
    .leftJoin(userTable, eq(assetPinTable.createdByUserId, userTable.id))
    .leftJoin(
      assetGuestTable,
      eq(assetPinTable.createdByGuestId, assetGuestTable.id),
    )
    .leftJoin(
      assigneeUserTable,
      eq(assetPinTable.assigneeUserId, assigneeUserTable.id),
    )
    .where(eq(assetPinTable.assetId, assetId))
    .orderBy(asc(assetPinTable.createdAt));

  const notes = await fetchNotesForPins(pinRows.map((pin) => pin.id));

  return pinRows.map((pin) => shapePin(pin, notes));
}

export async function fetchPinById(pinId: string) {
  const [pin] = await db
    .select(pinColumns)
    .from(assetPinTable)
    .leftJoin(userTable, eq(assetPinTable.createdByUserId, userTable.id))
    .leftJoin(
      assetGuestTable,
      eq(assetPinTable.createdByGuestId, assetGuestTable.id),
    )
    .leftJoin(
      assigneeUserTable,
      eq(assetPinTable.assigneeUserId, assigneeUserTable.id),
    )
    .where(eq(assetPinTable.id, pinId))
    .limit(1);

  if (!pin) return null;

  const notes = await fetchNotesForPins([pin.id]);

  return shapePin(pin, notes);
}
