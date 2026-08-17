import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { assetApprovalEventSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import { fetchApprovalEvents } from "./controllers/approval-queries";
import decideApproval from "./controllers/decide-approval";
import requestApproval from "./controllers/request-approval";

const assetApproval = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/:assetId",
    describeRoute({
      operationId: "listAssetApprovalEvents",
      tags: ["Asset Approval"],
      description: "List the approval history for an asset",
      responses: {
        200: {
          description: "Approval event history",
          content: {
            "application/json": {
              schema: resolver(v.array(assetApprovalEventSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ assetId: v.string() })),
    workspaceAccess.fromAssetId("assetId"),
    requireWorkspacePermission({ asset: ["read"] }),
    async (c) => {
      const { assetId } = c.req.valid("param");
      const events = await fetchApprovalEvents(assetId);
      return c.json(events);
    },
  )
  .post(
    "/:assetId",
    describeRoute({
      operationId: "requestAssetApproval",
      tags: ["Asset Approval"],
      description: "Send an asset for approval",
      responses: {
        200: {
          description: "Approval requested",
          content: {
            "application/json": {
              schema: resolver(v.array(assetApprovalEventSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ assetId: v.string() })),
    workspaceAccess.fromAssetId("assetId"),
    requireWorkspacePermission({ asset: ["update"] }),
    async (c) => {
      const { assetId } = c.req.valid("param");
      const userId = c.get("userId");
      const events = await requestApproval(assetId, userId);
      return c.json(events);
    },
  )
  .post(
    "/:assetId/decision",
    describeRoute({
      operationId: "decideAssetApproval",
      tags: ["Asset Approval"],
      description: "Approve or request changes on an asset pending approval",
      responses: {
        200: {
          description: "Decision recorded",
          content: {
            "application/json": {
              schema: resolver(v.array(assetApprovalEventSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ assetId: v.string() })),
    validator(
      "json",
      v.object({
        decision: v.picklist(["approved", "changes_requested"]),
        note: v.optional(v.pipe(v.string(), v.maxLength(2000))),
      }),
    ),
    workspaceAccess.fromAssetId("assetId"),
    requireWorkspacePermission({ asset: ["update"] }),
    async (c) => {
      const { assetId } = c.req.valid("param");
      const { decision, note } = c.req.valid("json");
      const userId = c.get("userId");
      const events = await decideApproval(assetId, userId, decision, note);
      return c.json(events);
    },
  );

export default assetApproval;
