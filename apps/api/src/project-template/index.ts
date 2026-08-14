import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import {
  projectTemplateColumnInputSchema,
  projectTemplateDetailSchema,
  projectTemplateListItemSchema,
  projectTemplateSchema,
  projectTemplateTaskInputSchema,
} from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createProjectTemplate from "./controllers/create-project-template";
import deleteProjectTemplate from "./controllers/delete-project-template";
import getProjectTemplate from "./controllers/get-project-template";
import getProjectTemplatesByWorkspace from "./controllers/get-project-templates-by-workspace";
import updateProjectTemplate from "./controllers/update-project-template";

const projectTemplate = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/workspace/:workspaceId",
    describeRoute({
      operationId: "getWorkspaceProjectTemplates",
      tags: ["Project Templates"],
      description: "Get all project templates for a workspace",
      responses: {
        200: {
          description: "List of project templates in the workspace",
          content: {
            "application/json": {
              schema: resolver(v.array(projectTemplateListItemSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    workspaceAccess.fromParam(),
    requireWorkspacePermission({ project_template: ["read"] }),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      const templates = await getProjectTemplatesByWorkspace(workspaceId);
      return c.json(templates);
    },
  )
  .get(
    "/:id",
    describeRoute({
      operationId: "getProjectTemplate",
      tags: ["Project Templates"],
      description:
        "Get a project template's full detail, including its columns and starter tasks",
      responses: {
        200: {
          description: "Project template detail",
          content: {
            "application/json": {
              schema: resolver(projectTemplateDetailSchema),
            },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProjectTemplate(),
    requireWorkspacePermission({ project_template: ["read"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const template = await getProjectTemplate(id);
      return c.json(template);
    },
  )
  .post(
    "/",
    describeRoute({
      operationId: "createProjectTemplate",
      tags: ["Project Templates"],
      description:
        "Create a new project template with its columns and optional starter tasks",
      responses: {
        200: {
          description: "Project template created successfully",
          content: {
            "application/json": { schema: resolver(projectTemplateSchema) },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        workspaceId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        columns: v.pipe(
          v.array(projectTemplateColumnInputSchema),
          v.minLength(1),
        ),
        tasks: v.optional(v.array(projectTemplateTaskInputSchema)),
      }),
    ),
    workspaceAccess.fromBody(),
    requireWorkspacePermission({ project_template: ["create"] }),
    async (c) => {
      const { workspaceId, name, description, icon, columns, tasks } =
        c.req.valid("json");
      const template = await createProjectTemplate(
        workspaceId,
        name,
        description,
        icon,
        columns,
        tasks,
      );
      return c.json(template);
    },
  )
  .put(
    "/:id",
    describeRoute({
      operationId: "updateProjectTemplate",
      tags: ["Project Templates"],
      description:
        "Update a project template's metadata and fully replace its columns and tasks",
      responses: {
        200: {
          description: "Project template updated successfully",
          content: {
            "application/json": { schema: resolver(projectTemplateSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        name: v.optional(v.string()),
        description: v.optional(v.nullable(v.string())),
        icon: v.optional(v.nullable(v.string())),
        columns: v.pipe(
          v.array(projectTemplateColumnInputSchema),
          v.minLength(1),
        ),
        tasks: v.optional(v.array(projectTemplateTaskInputSchema)),
      }),
    ),
    workspaceAccess.fromProjectTemplate(),
    requireWorkspacePermission({ project_template: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const template = await updateProjectTemplate(id, input);
      return c.json(template);
    },
  )
  .delete(
    "/:id",
    describeRoute({
      operationId: "deleteProjectTemplate",
      tags: ["Project Templates"],
      description:
        "Delete a project template (also deletes its columns and tasks)",
      responses: {
        200: {
          description: "Project template deleted successfully",
          content: {
            "application/json": { schema: resolver(projectTemplateSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProjectTemplate(),
    requireWorkspacePermission({ project_template: ["delete"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const template = await deleteProjectTemplate(id);
      return c.json(template);
    },
  );

export default projectTemplate;
