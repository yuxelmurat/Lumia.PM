import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type UpdateCustomFieldRequest = InferRequestType<
  (typeof client)["custom-field"][":id"]["$put"]
>["json"] &
  InferRequestType<(typeof client)["custom-field"][":id"]["$put"]>["param"];

async function updateCustomField({
  id,
  name,
  options,
  isRequired,
  position,
}: UpdateCustomFieldRequest) {
  const response = await client["custom-field"][":id"].$put({
    param: { id },
    json: { name, options, isRequired, position },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default updateCustomField;
