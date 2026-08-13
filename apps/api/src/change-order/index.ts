import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { changeOrderSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import { fetchChangeOrdersByProject } from "./controllers/change-order-queries";
import createChangeOrder from "./controllers/create-change-order";
import deleteChangeOrder from "./controllers/delete-change-order";
import updateChangeOrder from "./controllers/update-change-order";

const changeOrderStatusSchema = v.picklist([
  "pending_review",
  "approved",
  "rejected",
]);

const changeOrder = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listChangeOrders",
      tags: ["Change Orders"],
      description: "List change orders for a project",
      responses: {
        200: {
          description: "List of change orders",
          content: {
            "application/json": {
              schema: resolver(v.array(changeOrderSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ changeOrder: ["read"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const changeOrders = await fetchChangeOrdersByProject(projectId);
      return c.json(changeOrders);
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createChangeOrder",
      tags: ["Change Orders"],
      description: "Create a new change order",
      responses: {
        200: {
          description: "Change order created successfully",
          content: {
            "application/json": { schema: resolver(changeOrderSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
        description: v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
        costImpactCents: v.optional(v.nullable(v.number())),
        hoursImpact: v.optional(v.nullable(v.number())),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ changeOrder: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const created = await createChangeOrder(projectId, userId, input);
      return c.json(created);
    },
  )
  .patch(
    "/item/:id",
    describeRoute({
      operationId: "updateChangeOrder",
      tags: ["Change Orders"],
      description:
        "Partially update a change order, including approving or rejecting it",
      responses: {
        200: {
          description: "Change order updated successfully",
          content: {
            "application/json": { schema: resolver(changeOrderSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        title: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        description: v.optional(
          v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
        ),
        costImpactCents: v.optional(v.nullable(v.number())),
        hoursImpact: v.optional(v.nullable(v.number())),
        status: v.optional(changeOrderStatusSchema),
        decisionNote: v.optional(
          v.nullable(v.pipe(v.string(), v.maxLength(2000))),
        ),
      }),
    ),
    workspaceAccess.fromChangeOrder(),
    requireWorkspacePermission({ changeOrder: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const updated = await updateChangeOrder(id, userId, input);
      return c.json(updated);
    },
  )
  .delete(
    "/item/:id",
    describeRoute({
      operationId: "deleteChangeOrder",
      tags: ["Change Orders"],
      description: "Delete a change order",
      responses: {
        200: {
          description: "Change order deleted successfully",
          content: { "application/json": { schema: resolver(v.any()) } },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromChangeOrder(),
    requireWorkspacePermission({ changeOrder: ["delete"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteChangeOrder(id);
      return c.json(deleted);
    },
  );

export default changeOrder;
