import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type RegenerateTaskPublicLinkRequest = InferRequestType<
  (typeof client)["task"][":id"]["public-link"]["regenerate"]["$post"]
>["param"];

async function regenerateTaskPublicLink({
  id,
}: RegenerateTaskPublicLinkRequest) {
  const response = await client.task[":id"]["public-link"].regenerate.$post({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default regenerateTaskPublicLink;
