import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type UpdateImagePinRequest = InferRequestType<
  (typeof client)["task"][":id"]["image-pin"][":pinId"]["$patch"]
>["param"] & { resolved: boolean };

async function updateImagePin({ id, pinId, resolved }: UpdateImagePinRequest) {
  const response = await client.task[":id"]["image-pin"][":pinId"].$patch({
    param: { id, pinId },
    json: { resolved },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateImagePin;
