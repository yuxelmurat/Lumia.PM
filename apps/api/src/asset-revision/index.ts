import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { assetRevisionSchema } from "../schemas";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import { fetchAssetRevisionChain } from "./controllers/revision-queries";

const assetRevision = new Hono<{
  Variables: {
    userId: string;
  };
}>().get(
  "/:assetId/chain",
  describeRoute({
    operationId: "getAssetRevisionChain",
    tags: ["Asset Revisions"],
    description: "List the revision chain for an asset, oldest to newest",
    responses: {
      200: {
        description: "Revision chain",
        content: {
          "application/json": {
            schema: resolver(v.array(assetRevisionSchema)),
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
    const chain = await fetchAssetRevisionChain(assetId);
    return c.json(chain);
  },
);

export default assetRevision;
