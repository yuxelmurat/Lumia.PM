import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { permitTable } from "../../database/schema";
import { publishEvent } from "../../events";
import createNotification from "../../notification/controllers/create-notification";
import { claimPermitNumber } from "./claim-permit-number";
import { fetchPermitById } from "./permit-queries";

type CreatePermitInput = {
  jurisdictionName: string;
  permitType?: string | null;
  notes?: string | null;
  assigneeUserId?: string | null;
};

async function createPermit(
  projectId: string,
  userId: string,
  input: CreatePermitInput,
) {
  const createdId = await db.transaction(async (tx) => {
    const number = await claimPermitNumber(projectId, tx);

    const [permit] = await tx
      .insert(permitTable)
      .values({
        projectId,
        number,
        jurisdictionName: input.jurisdictionName,
        permitType: input.permitType ?? null,
        status: "not_submitted",
        notes: input.notes ?? null,
        assigneeUserId: input.assigneeUserId ?? null,
        createdByUserId: userId,
      })
      .returning({ id: permitTable.id });

    return permit?.id;
  });

  if (!createdId) {
    throw new HTTPException(500, { message: "Failed to create permit" });
  }

  const permit = await fetchPermitById(createdId);
  if (!permit) {
    throw new HTTPException(500, { message: "Failed to create permit" });
  }

  await publishEvent("permit.created", {
    permitId: permit.id,
    projectId,
    assigneeUserId: permit.assignee?.id ?? null,
  });

  if (permit.assignee && permit.assignee.id !== userId) {
    await createNotification({
      userId: permit.assignee.id,
      type: "permit_assigned",
      title: `PMT-${permit.number}: ${permit.jurisdictionName}`,
      content: "You were assigned a new permit to track",
      resourceId: permit.id,
      resourceType: "permit",
    });
  }

  return permit;
}

export default createPermit;
