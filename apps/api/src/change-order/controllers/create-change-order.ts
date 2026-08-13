import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { changeOrderTable } from "../../database/schema";
import { publishEvent } from "../../events";
import { fetchChangeOrderById } from "./change-order-queries";
import { claimChangeOrderNumber } from "./claim-change-order-number";

type CreateChangeOrderInput = {
  title: string;
  description: string;
  costImpactCents?: number | null;
  hoursImpact?: number | null;
};

async function createChangeOrder(
  projectId: string,
  userId: string,
  input: CreateChangeOrderInput,
) {
  const createdId = await db.transaction(async (tx) => {
    const number = await claimChangeOrderNumber(projectId, tx);

    const [changeOrder] = await tx
      .insert(changeOrderTable)
      .values({
        projectId,
        number,
        title: input.title,
        description: input.description,
        costImpactCents: input.costImpactCents ?? null,
        hoursImpact: input.hoursImpact ?? null,
        status: "pending_review",
        createdByUserId: userId,
      })
      .returning({ id: changeOrderTable.id });

    return changeOrder?.id;
  });

  if (!createdId) {
    throw new HTTPException(500, { message: "Failed to create change order" });
  }

  const changeOrder = await fetchChangeOrderById(createdId);
  if (!changeOrder) {
    throw new HTTPException(500, { message: "Failed to create change order" });
  }

  await publishEvent("change_order.created", {
    changeOrderId: changeOrder.id,
    projectId,
  });

  return changeOrder;
}

export default createChangeOrder;
