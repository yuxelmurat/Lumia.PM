import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { projectTable } from "../../database/schema";
import { createTaskImageUploadUrl } from "../../storage/s3";

// Caller is responsible for calling validateTaskAssetUploadInput() first and
// mapping its errors to a 400, so a missing-S3-config failure here can stay
// distinguishable (503) from a bad-input failure.
async function createProductSpecImageUpload(
  projectId: string,
  filename: string,
  contentType: string,
) {
  const [project] = await db
    .select({ workspaceId: projectTable.workspaceId })
    .from(projectTable)
    .where(eq(projectTable.id, projectId))
    .limit(1);

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  return createTaskImageUploadUrl({
    workspaceId: project.workspaceId,
    projectId,
    surface: "product-spec",
    filename,
    contentType,
  });
}

export default createProductSpecImageUpload;
