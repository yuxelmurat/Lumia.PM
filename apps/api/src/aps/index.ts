import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import { getViewerAccessToken, isApsConfigured } from "./client";
import getAssetTranslationStatus from "./get-status";
import translateAsset from "./translate-asset";

const translationStatusSchema = v.object({
  status: v.picklist(["pending", "inprogress", "success", "failed", "timeout"]),
  progress: v.nullable(v.string()),
  urn: v.nullable(v.string()),
});

const aps = new Hono<{
  Variables: {
    userId: string;
  };
}>()
  .post(
    "/:assetId/translate",
    describeRoute({
      operationId: "translateAsset",
      tags: ["Asset APS"],
      description:
        "Uploads a DWG asset to Autodesk Platform Services and submits it for viewer translation",
      responses: {
        200: {
          description: "Translation job submitted",
          content: { "application/json": { schema: resolver(v.any()) } },
        },
      },
    }),
    validator("param", v.object({ assetId: v.string() })),
    workspaceAccess.fromAssetId("assetId"),
    requireWorkspacePermission({ asset: ["update"] }),
    async (c) => {
      if (!isApsConfigured()) {
        return c.json(
          { message: "Autodesk Platform Services is not configured" },
          503,
        );
      }
      const { assetId } = c.req.valid("param");
      const result = await translateAsset(assetId);
      return c.json(result);
    },
  )
  .get(
    "/:assetId/status",
    describeRoute({
      operationId: "getAssetTranslationStatus",
      tags: ["Asset APS"],
      description: "Reads the current Autodesk translation status for an asset",
      responses: {
        200: {
          description: "Translation status",
          content: {
            "application/json": { schema: resolver(translationStatusSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ assetId: v.string() })),
    workspaceAccess.fromAssetId("assetId"),
    requireWorkspacePermission({ asset: ["read"] }),
    async (c) => {
      const { assetId } = c.req.valid("param");
      const status = await getAssetTranslationStatus(assetId);
      return c.json(status);
    },
  )
  .get(
    "/:assetId/viewer-token",
    describeRoute({
      operationId: "getAssetViewerToken",
      tags: ["Asset APS"],
      description:
        "Mints a short-lived, viewables-only Autodesk token for the browser-side Viewer SDK",
      responses: {
        200: {
          description: "Viewer access token",
          content: { "application/json": { schema: resolver(v.any()) } },
        },
      },
    }),
    validator("param", v.object({ assetId: v.string() })),
    workspaceAccess.fromAssetId("assetId"),
    requireWorkspacePermission({ asset: ["read"] }),
    async (c) => {
      if (!isApsConfigured()) {
        return c.json(
          { message: "Autodesk Platform Services is not configured" },
          503,
        );
      }
      const token = await getViewerAccessToken();
      return c.json(token);
    },
  );

export default aps;
