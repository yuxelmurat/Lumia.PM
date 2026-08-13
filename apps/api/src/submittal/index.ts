import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { submittalSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createSubmittal from "./controllers/create-submittal";
import deleteSubmittal from "./controllers/delete-submittal";
import { fetchSubmittalsByProject } from "./controllers/submittal-queries";
import updateSubmittal from "./controllers/update-submittal";

const submittalStatusSchema = v.picklist([
  "open",
  "approved",
  "revise_resubmit",
  "closed",
]);

const submittal = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listSubmittals",
      tags: ["Submittals"],
      description: "List submittals for a project",
      responses: {
        200: {
          description: "List of submittals",
          content: {
            "application/json": { schema: resolver(v.array(submittalSchema)) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ submittal: ["read"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const submittals = await fetchSubmittalsByProject(projectId);
      return c.json(submittals);
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createSubmittal",
      tags: ["Submittals"],
      description: "Create a new submittal",
      responses: {
        200: {
          description: "Submittal created successfully",
          content: {
            "application/json": { schema: resolver(submittalSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
        specSection: v.optional(
          v.nullable(v.pipe(v.string(), v.maxLength(80))),
        ),
        description: v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
        assigneeUserId: v.optional(v.nullable(v.string())),
        dueDate: v.optional(v.nullable(v.string())),
        supersedesSubmittalId: v.optional(v.nullable(v.string())),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ submittal: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const created = await createSubmittal(projectId, userId, input);
      return c.json(created);
    },
  )
  .patch(
    "/item/:id",
    describeRoute({
      operationId: "updateSubmittal",
      tags: ["Submittals"],
      description:
        "Partially update a submittal, including approving or requesting revision",
      responses: {
        200: {
          description: "Submittal updated successfully",
          content: {
            "application/json": { schema: resolver(submittalSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        title: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        specSection: v.optional(
          v.nullable(v.pipe(v.string(), v.maxLength(80))),
        ),
        description: v.optional(
          v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
        ),
        assigneeUserId: v.optional(v.nullable(v.string())),
        dueDate: v.optional(v.nullable(v.string())),
        status: v.optional(submittalStatusSchema),
        reviewNote: v.optional(
          v.nullable(v.pipe(v.string(), v.maxLength(2000))),
        ),
      }),
    ),
    workspaceAccess.fromSubmittal(),
    requireWorkspacePermission({ submittal: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const updated = await updateSubmittal(id, userId, input);
      return c.json(updated);
    },
  )
  .delete(
    "/item/:id",
    describeRoute({
      operationId: "deleteSubmittal",
      tags: ["Submittals"],
      description: "Delete a submittal",
      responses: {
        200: {
          description: "Submittal deleted successfully",
          content: { "application/json": { schema: resolver(v.any()) } },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromSubmittal(),
    requireWorkspacePermission({ submittal: ["delete"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteSubmittal(id);
      return c.json(deleted);
    },
  );

export default submittal;
