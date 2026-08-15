import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { workspaceBillingTable } from "../../database/schema";

/**
 * Marks a subscription for cancellation. Access is left active (status
 * unchanged) so the workspace keeps working until currentPeriodEnd; the
 * renewal scheduler skips workspaces with canceledAt set instead of charging
 * them again. PayTR has no hosted customer portal to redirect to for this,
 * so it's a direct in-app action.
 */
async function cancelSubscription(workspaceId: string) {
  const [billing] = await db
    .select()
    .from(workspaceBillingTable)
    .where(eq(workspaceBillingTable.workspaceId, workspaceId));

  if (!billing || !billing.plan) {
    throw new HTTPException(400, {
      message: "This workspace has no subscription to cancel",
    });
  }

  if (billing.canceledAt) {
    return;
  }

  await db
    .update(workspaceBillingTable)
    .set({ canceledAt: new Date() })
    .where(eq(workspaceBillingTable.workspaceId, workspaceId));
}

export default cancelSubscription;
