import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type CreateCustomFieldRequest = InferRequestType<
  (typeof client)["custom-field"]["$post"]
>["json"];

async function createCustomField({
  workspaceId,
  name,
  type,
  options,
  isRequired,
  position,
}: CreateCustomFieldRequest) {
  const response = await client["custom-field"].$post({
    json: {
      workspaceId,
      name,
      type,
      options,
      isRequired,
      position,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default createCustomField;
