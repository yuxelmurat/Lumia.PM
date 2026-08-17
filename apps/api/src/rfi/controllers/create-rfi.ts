import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { rfiTable } from "../../database/schema";
import { publishEvent } from "../../events";
import createNotification from "../../notification/controllers/create-notification";
import { claimRfiNumber } from "./claim-rfi-number";
import { fetchRfiById } from "./rfi-queries";

type CreateRfiInput = {
  subject: string;
  question: string;
  assigneeUserId?: string | null;
  dueDate?: string | null;
};

async function createRfi(
  projectId: string,
  userId: string,
  input: CreateRfiInput,
) {
  const createdId = await db.transaction(async (tx) => {
    const number = await claimRfiNumber(projectId, tx);

    const [rfi] = await tx
      .insert(rfiTable)
      .values({
        projectId,
        number,
        subject: input.subject,
        question: input.question,
        status: "open",
        assigneeUserId: input.assigneeUserId ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        createdByUserId: userId,
      })
      .returning({ id: rfiTable.id });

    return rfi?.id;
  });

  if (!createdId) {
    throw new HTTPException(500, { message: "Failed to create RFI" });
  }

  const rfi = await fetchRfiById(createdId);
  if (!rfi) {
    throw new HTTPException(500, { message: "Failed to create RFI" });
  }

  await publishEvent("rfi.created", {
    rfiId: rfi.id,
    projectId,
    assigneeUserId: rfi.assignee?.id ?? null,
  });

  if (rfi.assignee && rfi.assignee.id !== userId) {
    await createNotification({
      userId: rfi.assignee.id,
      type: "rfi_assigned",
      title: `RFI-${rfi.number}: ${rfi.subject}`,
      content: "You were assigned a new RFI",
      resourceId: rfi.id,
      resourceType: "rfi",
    });
  }

  return rfi;
}

export default createRfi;
