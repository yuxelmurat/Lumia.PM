import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type SetTaskCustomFieldValueRequest = InferRequestType<
  (typeof client)["custom-field"]["task"][":taskId"]["field"][":fieldId"]["$put"]
>["json"] &
  InferRequestType<
    (typeof client)["custom-field"]["task"][":taskId"]["field"][":fieldId"]["$put"]
  >["param"];

async function setTaskCustomFieldValue({
  taskId,
  fieldId,
  value,
}: SetTaskCustomFieldValueRequest) {
  const response = await client["custom-field"].task[":taskId"].field[
    ":fieldId"
  ].$put({
    param: { taskId, fieldId },
    json: { value },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default setTaskCustomFieldValue;
