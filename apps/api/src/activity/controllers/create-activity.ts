import db from "../../database";
import { activityTable } from "../../database/schema";

async function createActivity(
  taskId: string,
  type: string,
  userId: string | null,
  content: string | null,
  eventData?: Record<string, unknown> | null,
  externalUserName?: string,
) {
  const [activity] = await db
    .insert(activityTable)
    .values({
      taskId,
      type,
      userId,
      content,
      eventData: eventData ?? null,
      externalUserName: externalUserName ?? null,
    })
    .returning();
  return activity;
}

export default createActivity;
