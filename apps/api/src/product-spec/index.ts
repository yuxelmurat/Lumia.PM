import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { requireEntitlement } from "../billing/require-entitlement-middleware";
import { productSpecSchema } from "../schemas";
import { validateTaskAssetUploadInput } from "../storage/s3";
import { normalizeApiServerUrl } from "../utils/openapi-spec";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createProductSpecImageUpload from "./controllers/create-image-upload";
import createProductSpec from "./controllers/create-product-spec";
import deleteProductSpec from "./controllers/delete-product-spec";
import finalizeProductSpecImageUpload from "./controllers/finalize-image-upload";
import listProductSpecs from "./controllers/list-product-specs";
import updateProductSpec from "./controllers/update-product-spec";

const productSpecStatusSchema = v.picklist([
  "proposed",
  "client_approved",
  "ordered",
  "received",
  "installed",
]);

const productSpec = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/:projectId",
    describeRoute({
      operationId: "listProductSpecs",
      tags: ["Product Specs"],
      description: "List FF&E / material spec line items for a project",
      responses: {
        200: {
          description: "List of product specs",
          content: {
            "application/json": {
              schema: resolver(v.array(productSpecSchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ productSpec: ["read"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const specs = await listProductSpecs(projectId);
      return c.json(specs);
    },
  )
  .post(
    "/:projectId",
    describeRoute({
      operationId: "createProductSpec",
      tags: ["Product Specs"],
      description: "Create a new FF&E / material spec line item",
      responses: {
        200: {
          description: "Product spec created successfully",
          content: {
            "application/json": { schema: resolver(productSpecSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        roomLabel: v.optional(v.pipe(v.string(), v.maxLength(120))),
        name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
        vendor: v.optional(v.pipe(v.string(), v.maxLength(200))),
        unitCost: v.optional(v.pipe(v.number(), v.minValue(0))),
        quantity: v.optional(v.pipe(v.number(), v.minValue(1))),
        imageAssetId: v.optional(v.string()),
        linkedPinId: v.optional(v.string()),
        notes: v.optional(v.pipe(v.string(), v.maxLength(2000))),
        poNumber: v.optional(v.pipe(v.string(), v.maxLength(120))),
        expectedShipDate: v.optional(v.string()),
        actualShipDate: v.optional(v.string()),
        trackingNumber: v.optional(v.pipe(v.string(), v.maxLength(120))),
        carrier: v.optional(v.pipe(v.string(), v.maxLength(120))),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ productSpec: ["create"] }),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const spec = await createProductSpec(projectId, userId, input);
      return c.json(spec);
    },
  )
  .put(
    "/item/:id",
    describeRoute({
      operationId: "updateProductSpec",
      tags: ["Product Specs"],
      description: "Update a product spec line item, including its status",
      responses: {
        200: {
          description: "Product spec updated successfully",
          content: {
            "application/json": { schema: resolver(productSpecSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        roomLabel: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(120)))),
        name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
        vendor: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
        unitCost: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0)))),
        quantity: v.optional(v.pipe(v.number(), v.minValue(1))),
        status: v.optional(productSpecStatusSchema),
        imageAssetId: v.optional(v.nullable(v.string())),
        linkedPinId: v.optional(v.nullable(v.string())),
        notes: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
        poNumber: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(120)))),
        expectedShipDate: v.optional(v.nullable(v.string())),
        actualShipDate: v.optional(v.nullable(v.string())),
        trackingNumber: v.optional(
          v.nullable(v.pipe(v.string(), v.maxLength(120))),
        ),
        carrier: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(120)))),
      }),
    ),
    workspaceAccess.fromProductSpec(),
    requireWorkspacePermission({ productSpec: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const spec = await updateProductSpec(id, input);
      return c.json(spec);
    },
  )
  .delete(
    "/item/:id",
    describeRoute({
      operationId: "deleteProductSpec",
      tags: ["Product Specs"],
      description: "Delete a product spec line item",
      responses: {
        200: {
          description: "Product spec deleted successfully",
          content: {
            "application/json": { schema: resolver(productSpecSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProductSpec(),
    requireWorkspacePermission({ productSpec: ["delete"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const spec = await deleteProductSpec(id);
      return c.json(spec);
    },
  )
  .put(
    "/image-upload/:projectId",
    describeRoute({
      operationId: "createProductSpecImageUpload",
      tags: ["Product Specs"],
      description: "Create a presigned image upload URL for a product spec",
      responses: {
        200: {
          description: "Image upload URL created successfully",
          content: { "application/json": { schema: resolver(v.any()) } },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        filename: v.string(),
        contentType: v.string(),
        size: v.number(),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ productSpec: ["update"] }),
    requireEntitlement,
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { filename, contentType, size } = c.req.valid("json");

      try {
        validateTaskAssetUploadInput(contentType, size);
      } catch (error) {
        throw toUploadHttpException(error);
      }

      try {
        const upload = await createProductSpecImageUpload(
          projectId,
          filename,
          contentType,
        );
        return c.json(upload);
      } catch (error) {
        if (error instanceof HTTPException) throw error;
        throw new HTTPException(503, {
          message:
            error instanceof Error
              ? error.message
              : "Image uploads are not configured",
        });
      }
    },
  )
  .post(
    "/image-upload/:projectId/finalize",
    describeRoute({
      operationId: "finalizeProductSpecImageUpload",
      tags: ["Product Specs"],
      description:
        "Finalize an uploaded product spec image into an asset record",
      responses: {
        200: {
          description: "Image upload finalized successfully",
          content: { "application/json": { schema: resolver(v.any()) } },
        },
      },
    }),
    validator("param", v.object({ projectId: v.string() })),
    validator(
      "json",
      v.object({
        key: v.string(),
        filename: v.string(),
        contentType: v.string(),
        size: v.number(),
      }),
    ),
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ productSpec: ["update"] }),
    requireEntitlement,
    async (c) => {
      const { projectId } = c.req.valid("param");
      const input = c.req.valid("json");
      const userId = c.get("userId");

      try {
        const asset = await finalizeProductSpecImageUpload(
          projectId,
          userId,
          input,
        );
        const apiBaseUrl = normalizeApiServerUrl(
          process.env.KANEO_API_URL || new URL(c.req.url).origin,
        );
        return c.json({
          id: asset.id,
          url: `${apiBaseUrl}/asset/${asset.id}`,
        });
      } catch (error) {
        throw toUploadHttpException(error);
      }
    },
  );

export default productSpec;

/**
 * Storage validation helpers throw plain Errors; route handlers need those
 * surfaced as 400s while HTTPExceptions raised deeper down (404 project,
 * 400 key mismatch) pass through unchanged.
 */
function toUploadHttpException(error: unknown): HTTPException {
  if (error instanceof HTTPException) return error;
  return new HTTPException(400, {
    message:
      error instanceof Error ? error.message : "Invalid image upload request",
  });
}
