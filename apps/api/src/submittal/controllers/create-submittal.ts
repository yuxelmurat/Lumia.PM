import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { submittalTable } from "../../database/schema";
import { publishEvent } from "../../events";
import createNotification from "../../notification/controllers/create-notification";
import { claimSubmittalNumber } from "./claim-submittal-number";
import { fetchSubmittalById } from "./submittal-queries";

type CreateSubmittalInput = {
  title: string;
  specSection?: string | null;
  description: string;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  supersedesSubmittalId?: string | null;
};

async function createSubmittal(
  projectId: string,
  userId: string,
  input: CreateSubmittalInput,
) {
  if (input.supersedesSubmittalId) {
    const [superseded] = await db
      .select({ projectId: submittalTable.projectId })
      .from(submittalTable)
      .where(eq(submittalTable.id, input.supersedesSubmittalId))
      .limit(1);

    if (!superseded || superseded.projectId !== projectId) {
      throw new HTTPException(400, {
        message: "supersedesSubmittalId must belong to the same project.",
      });
    }
  }

  const createdId = await db.transaction(async (tx) => {
    const number = await claimSubmittalNumber(projectId, tx);

    const [submittal] = await tx
      .insert(submittalTable)
      .values({
        projectId,
        number,
        title: input.title,
        specSection: input.specSection ?? null,
        description: input.description,
        status: "open",
        assigneeUserId: input.assigneeUserId ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        supersedesSubmittalId: input.supersedesSubmittalId ?? null,
        createdByUserId: userId,
      })
      .returning({ id: submittalTable.id });

    return submittal?.id;
  });

  if (!createdId) {
    throw new HTTPException(500, { message: "Failed to create submittal" });
  }

  const submittal = await fetchSubmittalById(createdId);
  if (!submittal) {
    throw new HTTPException(500, { message: "Failed to create submittal" });
  }

  await publishEvent("submittal.created", {
    submittalId: submittal.id,
    projectId,
    assigneeUserId: submittal.assignee?.id ?? null,
  });

  if (submittal.assignee && submittal.assignee.id !== userId) {
    await createNotification({
      userId: submittal.assignee.id,
      type: "submittal_assigned",
      title: `SUB-${submittal.number}: ${submittal.title}`,
      content: "You were assigned a new submittal",
      resourceId: submittal.id,
      resourceType: "submittal",
    });
  }

  return submittal;
}

export default createSubmittal;
