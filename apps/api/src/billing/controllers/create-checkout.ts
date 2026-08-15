import { createId } from "@paralleldrive/cuid2";
import { count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { billingChargeTable, workspaceUserTable } from "../../database/schema";
import {
  type BillingInterval,
  isBillingEnabled,
  type Plan,
  priceFor,
} from "../config";
import { buildCardStorageCheckoutForm } from "../paytr-client";
import { getOrCreateWorkspaceBilling } from "./get-workspace-billing";

async function createCheckout({
  workspaceId,
  plan,
  interval,
  userEmail,
  userIp,
}: {
  workspaceId: string;
  plan: Plan;
  interval: BillingInterval;
  userEmail: string;
  userIp: string;
}) {
  if (!isBillingEnabled()) {
    throw new HTTPException(400, { message: "Billing is not enabled" });
  }

  const unitPriceKurus = priceFor(plan, interval);
  if (!unitPriceKurus) {
    throw new HTTPException(400, { message: "Unknown plan" });
  }

  const billing = await getOrCreateWorkspaceBilling(workspaceId);
  if (billing.status === "active") {
    throw new HTTPException(400, {
      message: "Workspace already has an active subscription",
    });
  }

  let seats = 1;
  if (plan === "team") {
    const [members] = await db
      .select({ value: count() })
      .from(workspaceUserTable)
      .where(eq(workspaceUserTable.workspaceId, workspaceId));
    seats = Math.max(1, members?.value ?? 1);
  }

  const amountKurus = unitPriceKurus * seats;
  const merchantOid = createId();

  await db.insert(billingChargeTable).values({
    id: merchantOid,
    workspaceId,
    kind: "checkout",
    plan,
    billingInterval: interval,
    seats,
    amountKurus,
  });

  const clientUrl = process.env.KANEO_CLIENT_URL ?? "";
  const returnUrl = `${clientUrl}/dashboard/settings/workspace/billing?checkout=success`;

  const { actionUrl, fields } = buildCardStorageCheckoutForm({
    merchantOid,
    userIp,
    email: userEmail,
    amountKurus,
    description: `Lumia.PM Cloud ${plan} (${interval})`,
    okUrl: returnUrl,
    failUrl: `${clientUrl}/dashboard/settings/workspace/billing?checkout=failed`,
    storeCard: true,
    utoken: billing.paytrCardToken,
  });

  return { actionUrl, fields };
}

export default createCheckout;
