import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import {
  customFieldDefinitionSchema,
  customFieldTypeSchema,
  customFieldValueSchema,
} from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createCustomField from "./controllers/create-custom-field";
import deleteCustomField from "./controllers/delete-custom-field";
import deleteTaskCustomFieldValue from "./controllers/delete-task-custom-field-value";
import getCustomFieldsByWorkspace from "./controllers/get-custom-fields-by-workspace";
import getTaskCustomFieldValues from "./controllers/get-task-custom-field-values";
import setTaskCustomFieldValue from "./controllers/set-task-custom-field-value";
import updateCustomField from "./controllers/update-custom-field";

const taskCustomFieldValueSchema = v.object({
  id: v.string(),
  fieldId: v.string(),
  taskId: v.string(),
  value: v.nullable(
    v.union([v.string(), v.number(), v.boolean(), v.array(v.string())]),
  ),
  createdAt: v.date(),
  updatedAt: v.date(),
  field: customFieldDefinitionSchema,
});

const customField = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/workspace/:workspaceId",
    describeRoute({
      operationId: "getWorkspaceCustomFields",
      tags: ["Custom Fields"],
      description: "Get all custom field definitions for a workspace",
      responses: {
        200: {
          description: "List of custom field definitions in the workspace",
          content: {
            "application/json": {
              schema: resolver(v.array(customFieldDefinitionSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    workspaceAccess.fromParam(),
    requireWorkspacePermission({ custom_field: ["read"] }),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      const fields = await getCustomFieldsByWorkspace(workspaceId);
      return c.json(fields);
    },
  )
  .post(
    "/",
    describeRoute({
      operationId: "createCustomField",
      tags: ["Custom Fields"],
      description: "Create a new custom field definition in a workspace",
      responses: {
        200: {
          description: "Custom field definition created successfully",
          content: {
            "application/json": {
              schema: resolver(customFieldDefinitionSchema),
            },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        workspaceId: v.string(),
        name: v.string(),
        type: customFieldTypeSchema,
        options: v.optional(v.array(v.string())),
        isRequired: v.optional(v.boolean()),
        position: v.optional(v.number()),
      }),
    ),
    workspaceAccess.fromBody(),
    requireWorkspacePermission({ custom_field: ["create"] }),
    async (c) => {
      const { workspaceId, name, type, options, isRequired, position } =
        c.req.valid("json");
      const field = await createCustomField(
        workspaceId,
        name,
        type,
        options,
        isRequired,
        position,
      );
      return c.json(field);
    },
  )
  .put(
    "/:id",
    describeRoute({
      operationId: "updateCustomField",
      tags: ["Custom Fields"],
      description:
        "Update an existing custom field definition (type cannot be changed)",
      responses: {
        200: {
          description: "Custom field definition updated successfully",
          content: {
            "application/json": {
              schema: resolver(customFieldDefinitionSchema),
            },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        name: v.optional(v.string()),
        type: v.optional(customFieldTypeSchema),
        options: v.optional(v.nullable(v.array(v.string()))),
        isRequired: v.optional(v.boolean()),
        position: v.optional(v.number()),
      }),
    ),
    workspaceAccess.fromCustomFieldDefinition(),
    requireWorkspacePermission({ custom_field: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const field = await updateCustomField(id, input);
      return c.json(field);
    },
  )
  .delete(
    "/:id",
    describeRoute({
      operationId: "deleteCustomField",
      tags: ["Custom Fields"],
      description:
        "Delete a custom field definition (also deletes its task values)",
      responses: {
        200: {
          description: "Custom field definition deleted successfully",
          content: {
            "application/json": {
              schema: resolver(customFieldDefinitionSchema),
            },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromCustomFieldDefinition(),
    requireWorkspacePermission({ custom_field: ["delete"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const field = await deleteCustomField(id);
      return c.json(field);
    },
  )
  .get(
    "/task/:taskId",
    describeRoute({
      operationId: "getTaskCustomFieldValues",
      tags: ["Custom Fields"],
      description:
        "Get all custom field values for a task, joined with their field definitions",
      responses: {
        200: {
          description: "List of custom field values for the task",
          content: {
            "application/json": {
              schema: resolver(v.array(taskCustomFieldValueSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ taskId: v.string() })),
    workspaceAccess.fromTaskId(),
    async (c) => {
      const { taskId } = c.req.valid("param");
      const values = await getTaskCustomFieldValues(taskId);
      return c.json(values);
    },
  )
  .put(
    "/task/:taskId/field/:fieldId",
    describeRoute({
      operationId: "setTaskCustomFieldValue",
      tags: ["Custom Fields"],
      description: "Set (create or update) a task's value for a custom field",
      responses: {
        200: {
          description: "Custom field value set successfully",
          content: {
            "application/json": { schema: resolver(customFieldValueSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ taskId: v.string(), fieldId: v.string() })),
    validator(
      "json",
      v.object({
        value: v.union([
          v.string(),
          v.number(),
          v.boolean(),
          v.array(v.string()),
        ]),
      }),
    ),
    workspaceAccess.fromTaskId(),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { taskId, fieldId } = c.req.valid("param");
      const { value } = c.req.valid("json");
      const userId = c.get("userId");
      const result = await setTaskCustomFieldValue(
        taskId,
        fieldId,
        value,
        userId,
      );
      return c.json(result);
    },
  )
  .delete(
    "/task/:taskId/field/:fieldId",
    describeRoute({
      operationId: "deleteTaskCustomFieldValue",
      tags: ["Custom Fields"],
      description: "Clear a task's value for a custom field",
      responses: {
        200: {
          description: "Custom field value cleared successfully",
          content: {
            "application/json": { schema: resolver(customFieldValueSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ taskId: v.string(), fieldId: v.string() })),
    workspaceAccess.fromTaskId(),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { taskId, fieldId } = c.req.valid("param");
      const result = await deleteTaskCustomFieldValue(taskId, fieldId);
      return c.json(result);
    },
  );

export default customField;
