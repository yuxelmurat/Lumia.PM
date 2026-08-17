import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { assetTable, projectTable } from "../../database/schema";
import {
  assertTaskImageKeyMatchesContext,
  isImageContentType,
  validateTaskAssetUploadInput,
} from "../../storage/s3";

async function finalizeProductSpecImageUpload(
  projectId: string,
  userId: string,
  input: {
    key: string;
    filename: string;
    contentType: string;
    size: number;
  },
) {
  validateTaskAssetUploadInput(input.contentType, input.size);

  const [project] = await db
    .select({ workspaceId: projectTable.workspaceId })
    .from(projectTable)
    .where(eq(projectTable.id, projectId))
    .limit(1);

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  const normalizedKey = input.key.trim();
  if (
    !assertTaskImageKeyMatchesContext(normalizedKey, {
      workspaceId: project.workspaceId,
      projectId,
      surface: "product-spec",
    })
  ) {
    throw new HTTPException(400, {
      message: "Image upload key does not match the project context.",
    });
  }

  const [existingAsset] = await db
    .select({ id: assetTable.id })
    .from(assetTable)
    .where(eq(assetTable.objectKey, normalizedKey))
    .limit(1);

  const [asset] = existingAsset
    ? await db
        .update(assetTable)
        .set({
          workspaceId: project.workspaceId,
          projectId,
          filename: input.filename,
          mimeType: input.contentType,
          size: input.size,
          kind: isImageContentType(input.contentType) ? "image" : "attachment",
          surface: "product-spec",
          createdBy: userId,
        })
        .where(eq(assetTable.id, existingAsset.id))
        .returning({ id: assetTable.id })
    : await db
        .insert(assetTable)
        .values({
          workspaceId: project.workspaceId,
          projectId,
          objectKey: normalizedKey,
          filename: input.filename,
          mimeType: input.contentType,
          size: input.size,
          kind: isImageContentType(input.contentType) ? "image" : "attachment",
          surface: "product-spec",
          createdBy: userId,
        })
        .returning({ id: assetTable.id });

  if (!asset) {
    throw new HTTPException(500, { message: "Failed to save asset" });
  }

  return asset;
}

export default finalizeProductSpecImageUpload;
