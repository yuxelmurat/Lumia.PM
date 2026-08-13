import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { assetPinSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createPin from "./controllers/create-pin";
import createPinNote from "./controllers/create-pin-note";
import listPins from "./controllers/list-pins";
import updatePin from "./controllers/update-pin";

const assetPin = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/:assetId",
    describeRoute({
      operationId: "listAssetPins",
      tags: ["Asset Pins"],
      description: "List position-anchored pin annotations for an asset",
      responses: {
        200: {
          description: "List of pins for the asset",
          content: {
            "application/json": { schema: resolver(v.array(assetPinSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ assetId: v.string() })),
    workspaceAccess.fromAssetId("assetId"),
    requireWorkspacePermission({ asset: ["read"] }),
    async (c) => {
      const { assetId } = c.req.valid("param");
      const pins = await listPins(assetId);
      return c.json(pins);
    },
  )
  .post(
    "/:assetId",
    describeRoute({
      operationId: "createAssetPin",
      tags: ["Asset Pins"],
      description:
        "Create a new pin annotation anchored to a point on an asset",
      responses: {
        200: {
          description: "Pin created successfully",
          content: { "application/json": { schema: resolver(assetPinSchema) } },
        },
      },
    }),
    validator("param", v.object({ assetId: v.string() })),
    validator(
      "json",
      v.object({
        content: v.pipe(v.string(), v.minLength(1)),
        x: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1))),
        y: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1))),
        viewerState: v.optional(v.any()),
        label: v.optional(v.pipe(v.string(), v.maxLength(80))),
      }),
    ),
    workspaceAccess.fromAssetId("assetId"),
    requireWorkspacePermission({ asset: ["update"] }),
    async (c) => {
      const { assetId } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const pin = await createPin(assetId, userId, input);
      return c.json(pin);
    },
  )
  .post(
    "/pin/:pinId/notes",
    describeRoute({
      operationId: "createAssetPinNote",
      tags: ["Asset Pins"],
      description: "Reply to an existing pin's note thread",
      responses: {
        200: {
          description: "Note created successfully",
          content: { "application/json": { schema: resolver(assetPinSchema) } },
        },
      },
    }),
    validator("param", v.object({ pinId: v.string() })),
    validator(
      "json",
      v.object({ content: v.pipe(v.string(), v.minLength(1)) }),
    ),
    workspaceAccess.fromAssetPin(),
    requireWorkspacePermission({ asset: ["update"] }),
    async (c) => {
      const { pinId } = c.req.valid("param");
      const { content } = c.req.valid("json");
      const userId = c.get("userId");
      const pin = await createPinNote(pinId, userId, content);
      return c.json(pin);
    },
  )
  .patch(
    "/pin/:pinId",
    describeRoute({
      operationId: "updateAssetPinStatus",
      tags: ["Asset Pins"],
      description:
        "Update a pin: resolve/reopen it, or set its punch-list metadata (assignee, due date, punch flag)",
      responses: {
        200: {
          description: "Pin updated successfully",
          content: { "application/json": { schema: resolver(assetPinSchema) } },
        },
      },
    }),
    validator("param", v.object({ pinId: v.string() })),
    validator(
      "json",
      v.object({
        status: v.optional(v.picklist(["open", "resolved"])),
        isPunchItem: v.optional(v.boolean()),
        assigneeUserId: v.optional(v.nullable(v.string())),
        dueDate: v.optional(v.nullable(v.string())),
      }),
    ),
    workspaceAccess.fromAssetPin(),
    requireWorkspacePermission({ asset: ["update"] }),
    async (c) => {
      const { pinId } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const pin = await updatePin(pinId, userId, input);
      return c.json(pin);
    },
  );

export default assetPin;
