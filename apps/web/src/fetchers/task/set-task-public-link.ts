import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type SetTaskPublicLinkRequest = InferRequestType<
  (typeof client)["task"][":id"]["public-link"]["$put"]
>["param"] &
  InferRequestType<
    (typeof client)["task"][":id"]["public-link"]["$put"]
  >["json"];

async function setTaskPublicLink({
  id,
  isPublic,
  expiresAt,
}: SetTaskPublicLinkRequest) {
  const response = await client.task[":id"]["public-link"].$put({
    param: { id },
    json: { isPublic, expiresAt },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default setTaskPublicLink;
