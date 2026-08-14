import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type DeleteTaskCustomFieldValueRequest = InferRequestType<
  (typeof client)["custom-field"]["task"][":taskId"]["field"][":fieldId"]["$delete"]
>["param"];

async function deleteTaskCustomFieldValue({
  taskId,
  fieldId,
}: DeleteTaskCustomFieldValueRequest) {
  const response = await client["custom-field"].task[":taskId"].field[
    ":fieldId"
  ].$delete({
    param: { taskId, fieldId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default deleteTaskCustomFieldValue;
