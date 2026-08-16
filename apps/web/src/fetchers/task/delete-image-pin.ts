import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type DeleteImagePinRequest = InferRequestType<
  (typeof client)["task"][":id"]["image-pin"][":pinId"]["$delete"]
>["param"];

async function deleteImagePin({ id, pinId }: DeleteImagePinRequest) {
  const response = await client.task[":id"]["image-pin"][":pinId"].$delete({
    param: { id, pinId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default deleteImagePin;
