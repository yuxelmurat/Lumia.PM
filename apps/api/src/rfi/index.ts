import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { rfiSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createRfi from "./controllers/create-rfi";
import deleteRfi from "./controllers/delete-rfi";
import { fetchRfisByProject } from "./controllers/rfi-queries";
import updateRfi from "./controllers/update-rfi";

const rfiStatusSchema = v.picklist(["open", "answered", "closed"]);

const rfi = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listRfis",
      tags: ["RFIs"],
      description: "List RFIs (requests for information) for a project",
      responses: {
        200: {
          description: "List of RFIs",
          content: {
            "application/json": { schema: resolver(v.array(rfiSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ rfi: ["read"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const rfis = await fetchRfisByProject(projectId);
      return c.json(rfis);
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createRfi",
      tags: ["RFIs"],
      description: "Create a new RFI",
      responses: {
        200: {
          description: "RFI created successfully",
          content: { "application/json": { schema: resolver(rfiSchema) } },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        subject: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
        question: v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
        assigneeUserId: v.optional(v.nullable(v.string())),
        dueDate: v.optional(v.nullable(v.string())),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ rfi: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const created = await createRfi(projectId, userId, input);
      return c.json(created);
    },
  )
  .patch(
    "/item/:id",
    describeRoute({
      operationId: "updateRfi",
      tags: ["RFIs"],
      description: "Partially update an RFI, including answering or closing it",
      responses: {
        200: {
          description: "RFI updated successfully",
          content: { "application/json": { schema: resolver(rfiSchema) } },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        subject: v.optional(
          v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
        ),
        question: v.optional(
          v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
        ),
        assigneeUserId: v.optional(v.nullable(v.string())),
        dueDate: v.optional(v.nullable(v.string())),
        answer: v.optional(v.pipe(v.string(), v.maxLength(4000))),
        status: v.optional(rfiStatusSchema),
      }),
    ),
    workspaceAccess.fromRfi(),
    requireWorkspacePermission({ rfi: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const updated = await updateRfi(id, userId, input);
      return c.json(updated);
    },
  )
  .delete(
    "/item/:id",
    describeRoute({
      operationId: "deleteRfi",
      tags: ["RFIs"],
      description: "Delete an RFI",
      responses: {
        200: {
          description: "RFI deleted successfully",
          content: { "application/json": { schema: resolver(v.any()) } },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromRfi(),
    requireWorkspacePermission({ rfi: ["delete"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteRfi(id);
      return c.json(deleted);
    },
  );

export default rfi;
