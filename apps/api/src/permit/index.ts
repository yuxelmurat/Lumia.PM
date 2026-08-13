import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { permitSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createPermit from "./controllers/create-permit";
import deletePermit from "./controllers/delete-permit";
import { fetchPermitsByProject } from "./controllers/permit-queries";
import updatePermit from "./controllers/update-permit";

const permitStatusSchema = v.picklist([
  "not_submitted",
  "submitted",
  "corrections_required",
  "approved",
  "issued",
]);

const permit = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listPermits",
      tags: ["Permits"],
      description: "List permits for a project",
      responses: {
        200: {
          description: "List of permits",
          content: {
            "application/json": { schema: resolver(v.array(permitSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ permit: ["read"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const permits = await fetchPermitsByProject(projectId);
      return c.json(permits);
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createPermit",
      tags: ["Permits"],
      description: "Create a new permit tracking entry",
      responses: {
        200: {
          description: "Permit created successfully",
          content: {
            "application/json": { schema: resolver(permitSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        jurisdictionName: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
        permitType: v.optional(
          v.nullable(v.pipe(v.string(), v.maxLength(120))),
        ),
        notes: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
        assigneeUserId: v.optional(v.nullable(v.string())),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ permit: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const created = await createPermit(projectId, userId, input);
      return c.json(created);
    },
  )
  .patch(
    "/item/:id",
    describeRoute({
      operationId: "updatePermit",
      tags: ["Permits"],
      description: "Partially update a permit's status and details",
      responses: {
        200: {
          description: "Permit updated successfully",
          content: {
            "application/json": { schema: resolver(permitSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        jurisdictionName: v.optional(
          v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
        ),
        permitType: v.optional(
          v.nullable(v.pipe(v.string(), v.maxLength(120))),
        ),
        status: v.optional(permitStatusSchema),
        permitNumber: v.optional(
          v.nullable(v.pipe(v.string(), v.maxLength(120))),
        ),
        submittedDate: v.optional(v.nullable(v.string())),
        approvalDate: v.optional(v.nullable(v.string())),
        notes: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
        assigneeUserId: v.optional(v.nullable(v.string())),
      }),
    ),
    workspaceAccess.fromPermit(),
    requireWorkspacePermission({ permit: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const updated = await updatePermit(id, userId, input);
      return c.json(updated);
    },
  )
  .delete(
    "/item/:id",
    describeRoute({
      operationId: "deletePermit",
      tags: ["Permits"],
      description: "Delete a permit tracking entry",
      responses: {
        200: {
          description: "Permit deleted successfully",
          content: { "application/json": { schema: resolver(v.any()) } },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromPermit(),
    requireWorkspacePermission({ permit: ["delete"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deletePermit(id);
      return c.json(deleted);
    },
  );

export default permit;
