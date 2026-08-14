import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type GetTaskCustomFieldValuesRequest = InferRequestType<
  (typeof client)["custom-field"]["task"][":taskId"]["$get"]
>["param"];

async function getTaskCustomFieldValues({
  taskId,
}: GetTaskCustomFieldValuesRequest) {
  const response = await client["custom-field"].task[":taskId"].$get({
    param: {
      taskId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default getTaskCustomFieldValues;
