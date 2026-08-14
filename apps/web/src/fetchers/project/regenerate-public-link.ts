import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type RegeneratePublicLinkRequest = InferRequestType<
  (typeof client)["project"][":id"]["public-link"]["regenerate"]["$post"]
>["param"];

async function regeneratePublicLink({ id }: RegeneratePublicLinkRequest) {
  const response = await client.project[":id"]["public-link"][
    "regenerate"
  ].$post({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default regeneratePublicLink;
