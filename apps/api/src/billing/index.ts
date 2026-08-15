import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describeRoute, validator } from "hono-openapi";
import * as v from "valibot";
import db from "../database";
import { workspaceUserTable } from "../database/schema";
import { validateWorkspaceAccess } from "../utils/validate-workspace-access";
import { isBillingEnabled } from "./config";
import cancelSubscription from "./controllers/cancel-subscription";
import createCheckout from "./controllers/create-checkout";
import getWorkspaceBilling from "./controllers/get-workspace-billing";
import handleCallback from "./controllers/handle-webhook";

type Variables = {
  userId: string;
  userEmail: string;
};

async function requireBillingManager(userId: string, workspaceId: string) {
  await validateWorkspaceAccess(userId, workspaceId);

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, workspaceId),
        eq(workspaceUserTable.userId, userId),
        inArray(workspaceUserTable.role, ["owner", "admin"]),
      ),
    );

  if (!member) {
    throw new HTTPException(403, {
      message: "Only workspace owners and admins can manage billing",
    });
  }
}

const billing = new Hono<{ Variables: Variables }>()
  .post("/webhook", async (c) => {
    if (!isBillingEnabled()) {
      throw new HTTPException(404, { message: "Not found" });
    }

    // PayTR's bildirim callback is form-encoded, not JSON, and requires the
    // literal plain-text body "OK" on success or PayTR retries for up to 24h.
    const rawBody = await c.req.parseBody();
    const body: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawBody)) {
      body[key] = String(value);
    }

    if (
      !body.merchant_oid ||
      !body.status ||
      !body.total_amount ||
      !body.hash
    ) {
      console.error("billing: callback missing required fields");
      throw new HTTPException(400, { message: "Invalid callback" });
    }

    const result = await handleCallback(body);

    if (!result.ok) {
      throw new HTTPException(400, { message: result.reason });
    }

    return c.text("OK");
  })
  .get(
    "/:workspaceId",
    describeRoute({
      operationId: "getWorkspaceBilling",
      tags: ["Billing"],
      description:
        "Get the billing state and entitlement for a workspace. Returns billingEnabled: false everywhere when billing is not configured.",
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      await validateWorkspaceAccess(c.get("userId"), workspaceId);
      return c.json(await getWorkspaceBilling(workspaceId));
    },
  )
  .post(
    "/:workspaceId/checkout",
    describeRoute({
      operationId: "createBillingCheckout",
      tags: ["Billing"],
      description:
        "Create a PayTR Direct API checkout for a workspace plan. Owner/admin only. Returns a form the browser posts directly to PayTR (raw card data never transits our server) to charge the plan and store a reusable card for future renewals.",
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    validator(
      "json",
      v.object({
        plan: v.picklist(["personal", "team"]),
        interval: v.picklist(["monthly", "annual"]),
      }),
    ),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      const { plan, interval } = c.req.valid("json");
      await requireBillingManager(c.get("userId"), workspaceId);

      const forwardedFor = c.req.header("x-forwarded-for");
      const userIp = forwardedFor?.split(",")[0]?.trim() || "0.0.0.0";

      const result = await createCheckout({
        workspaceId,
        plan,
        interval,
        userEmail: c.get("userEmail") ?? "",
        userIp,
      });
      return c.json(result);
    },
  )
  .post(
    "/:workspaceId/cancel",
    describeRoute({
      operationId: "cancelBillingSubscription",
      tags: ["Billing"],
      description:
        "Cancel the workspace's subscription. Access stays active until currentPeriodEnd; the renewal scheduler stops charging the stored card after that. Owner/admin only.",
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      await requireBillingManager(c.get("userId"), workspaceId);

      await cancelSubscription(workspaceId);
      return c.json({ ok: true });
    },
  );

export default billing;
