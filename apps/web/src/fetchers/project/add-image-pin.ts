import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

// Same untyped-body situation as set-public-task-approval.ts — the route
// reads its JSON body by hand rather than through a Valibot validator, so
// the payload shape is typed manually here.
export type AddImagePinRequest = InferRequestType<
  (typeof client)["public-project"][":projectId"]["task"][":taskId"]["asset"][":assetId"]["pin"]["$put"]
>["param"] & {
  clientName: string;
  content: string;
  xPercent: number;
  yPercent: number;
};

async function addImagePin({
  projectId,
  taskId,
  assetId,
  clientName,
  content,
  xPercent,
  yPercent,
}: AddImagePinRequest) {
  const endpoint =
    client["public-project"][":projectId"].task[":taskId"].asset[":assetId"]
      .pin;

  const response = await endpoint.$put({
    param: { projectId, taskId, assetId },
    json: { clientName, content, xPercent, yPercent },
  } as Parameters<typeof endpoint.$put>[0]);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default addImagePin;
