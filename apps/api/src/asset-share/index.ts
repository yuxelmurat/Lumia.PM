import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { assetShareLinkSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createShareLink from "./controllers/create-share-link";
import listShareLinks from "./controllers/list-share-links";
import revokeShareLink from "./controllers/revoke-share-link";

const assetShare = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .get(
    "/:assetId",
    describeRoute({
      operationId: "listAssetShareLinks",
      tags: ["Asset Share Links"],
      description: "List share links for an asset",
      responses: {
        200: {
          description: "List of share links",
          content: {
            "application/json": {
              schema: resolver(v.array(assetShareLinkSchema)),
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
      const links = await listShareLinks(assetId);
      return c.json(links);
    },
  )
  .post(
    "/:assetId",
    describeRoute({
      operationId: "createAssetShareLink",
      tags: ["Asset Share Links"],
      description:
        "Create a shareable, token-based link so an external client can view an asset and leave pin annotations without an account",
      responses: {
        200: {
          description: "Share link created successfully",
          content: {
            "application/json": { schema: resolver(assetShareLinkSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ assetId: v.string() })),
    validator(
      "json",
      v.object({
        expiresAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
      }),
    ),
    workspaceAccess.fromAssetId("assetId"),
    requireWorkspacePermission({ asset: ["update"] }),
    async (c) => {
      const { assetId } = c.req.valid("param");
      const { expiresAt } = c.req.valid("json");
      const userId = c.get("userId");
      const link = await createShareLink(
        assetId,
        userId,
        expiresAt ? new Date(expiresAt) : null,
      );
      return c.json(link);
    },
  )
  .delete(
    "/:id",
    describeRoute({
      operationId: "revokeAssetShareLink",
      tags: ["Asset Share Links"],
      description: "Revoke a share link, immediately invalidating guest access",
      responses: {
        200: {
          description: "Share link revoked successfully",
          content: {
            "application/json": { schema: resolver(assetShareLinkSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromAssetShareLink(),
    requireWorkspacePermission({ asset: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.get("userId");
      const link = await revokeShareLink(id, userId);
      return c.json(link);
    },
  );

export default assetShare;
