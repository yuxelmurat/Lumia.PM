import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type SetPublicLinkExpiryRequest = InferRequestType<
  (typeof client)["project"][":id"]["public-link"]["$put"]
>["json"] &
  InferRequestType<
    (typeof client)["project"][":id"]["public-link"]["$put"]
  >["param"];

async function setPublicLinkExpiry({
  id,
  expiresAt,
}: SetPublicLinkExpiryRequest) {
  const response = await client.project[":id"]["public-link"].$put({
    param: { id },
    json: { expiresAt },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default setPublicLinkExpiry;
