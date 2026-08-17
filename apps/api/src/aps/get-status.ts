import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import { assetTable } from "../database/schema";
import { getTranslationStatus } from "./client";

// Response shape is re-declared here (rather than reused from ApsTranslationStatus)
// so the Hono RPC client in @kaneo/libs can name the type without reaching
// into apps/api's internal module graph.
type TranslationStatusResponse = {
  status: "pending" | "inprogress" | "success" | "failed" | "timeout";
  progress: string | null;
  urn: string | null;
};

async function getAssetTranslationStatus(
  assetId: string,
): Promise<TranslationStatusResponse> {
  const [asset] = await db
    .select({ apsUrn: assetTable.apsUrn, kind: assetTable.kind })
    .from(assetTable)
    .where(eq(assetTable.id, assetId))
    .limit(1);

  if (!asset) {
    throw new HTTPException(404, { message: "Asset not found" });
  }

  if (asset.kind !== "dwg" || !asset.apsUrn) {
    return { status: "pending", progress: null, urn: null };
  }

  const { status, progress } = await getTranslationStatus(asset.apsUrn);

  // Persist terminal states so future reads (and the DWG upload flow) don't
  // need to hit Autodesk again once a translation has settled.
  if (status !== "pending" && status !== "inprogress") {
    await db
      .update(assetTable)
      .set({ apsTranslationStatus: status })
      .where(eq(assetTable.id, assetId));
  }

  return { status, progress, urn: asset.apsUrn };
}

export default getAssetTranslationStatus;
