import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { assetTable, imagePinTable, taskTable } from "../../database/schema";
import { resolvePublicProject } from "../../utils/resolve-public-project";

const MAX_CLIENT_NAME_LENGTH = 100;
const MAX_CONTENT_LENGTH = 1000;

async function addImagePin({
  token,
  taskId,
  assetId,
  clientName,
  content,
  xPercent,
  yPercent,
}: {
  token: string;
  taskId: string;
  assetId: string;
  clientName: string;
  content: string;
  xPercent: number;
  yPercent: number;
}) {
  const trimmedClientName = clientName?.trim() ?? "";
  if (trimmedClientName.length === 0) {
    throw new HTTPException(400, { message: "clientName is required" });
  }
  if (trimmedClientName.length > MAX_CLIENT_NAME_LENGTH) {
    throw new HTTPException(400, {
      message: `clientName must be at most ${MAX_CLIENT_NAME_LENGTH} characters`,
    });
  }

  const trimmedContent = content?.trim() ?? "";
  if (trimmedContent.length === 0) {
    throw new HTTPException(400, { message: "content is required" });
  }
  if (trimmedContent.length > MAX_CONTENT_LENGTH) {
    throw new HTTPException(400, {
      message: `content must be at most ${MAX_CONTENT_LENGTH} characters`,
    });
  }

  if (
    !Number.isFinite(xPercent) ||
    !Number.isFinite(yPercent) ||
    xPercent < 0 ||
    xPercent > 100 ||
    yPercent < 0 ||
    yPercent > 100
  ) {
    throw new HTTPException(400, {
      message: "xPercent and yPercent must be between 0 and 100",
    });
  }

  // Validates the link itself (exists, public, not expired) before ever
  // touching the task, same as the approval route.
  const project = await resolvePublicProject(token);

  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, taskId),
  });
  if (!task || task.projectId !== project.id) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  const asset = await db.query.assetTable.findFirst({
    where: eq(assetTable.id, assetId),
  });
  if (!asset || asset.taskId !== taskId) {
    throw new HTTPException(404, { message: "Image not found" });
  }

  const [pin] = await db
    .insert(imagePinTable)
    .values({
      assetId,
      taskId,
      clientName: trimmedClientName,
      content: trimmedContent,
      xPercent,
      yPercent,
    })
    .returning();

  if (!pin) {
    throw new HTTPException(500, { message: "Failed to save pin comment" });
  }

  return pin;
}

export default addImagePin;
