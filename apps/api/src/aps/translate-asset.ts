import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import { assetTable } from "../database/schema";
import { getPrivateObject } from "../storage/s3";
import {
  ensureBucket,
  resolveBucketKey,
  submitTranslationJob,
  uploadObjectToOss,
} from "./client";

async function streamToBuffer(body: unknown): Promise<Buffer> {
  const stream = body as ReadableStream<Uint8Array>;
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

/**
 * Uploads a previously-finalized DWG asset to Autodesk OSS and submits it
 * for translation. Fetches the file from our own storage rather than the
 * client, so the browser never needs direct access to Autodesk credentials.
 */
async function translateAsset(assetId: string) {
  const [asset] = await db
    .select({
      id: assetTable.id,
      workspaceId: assetTable.workspaceId,
      objectKey: assetTable.objectKey,
      kind: assetTable.kind,
    })
    .from(assetTable)
    .where(eq(assetTable.id, assetId))
    .limit(1);

  if (!asset) {
    throw new HTTPException(404, { message: "Asset not found" });
  }

  if (asset.kind !== "dwg") {
    throw new HTTPException(400, {
      message: "Only DWG assets can be translated for viewing",
    });
  }

  await db
    .update(assetTable)
    .set({ apsTranslationStatus: "pending" })
    .where(eq(assetTable.id, assetId));

  try {
    const object = await getPrivateObject(asset.objectKey);
    const buffer = await streamToBuffer(object.body);

    const bucketKey = resolveBucketKey(asset.workspaceId);
    await ensureBucket(bucketKey);

    const urn = await uploadObjectToOss(bucketKey, asset.id, buffer);
    await submitTranslationJob(urn);

    await db
      .update(assetTable)
      .set({ apsUrn: urn, apsTranslationStatus: "inprogress" })
      .where(eq(assetTable.id, assetId));

    return { urn, status: "inprogress" as const };
  } catch (error) {
    await db
      .update(assetTable)
      .set({ apsTranslationStatus: "failed" })
      .where(eq(assetTable.id, assetId));
    throw error;
  }
}

export default translateAsset;
