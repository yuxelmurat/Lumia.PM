import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type DeleteProjectTemplateRequest = InferRequestType<
  (typeof client)["project-template"][":id"]["$delete"]
>["param"];

async function deleteProjectTemplate({ id }: DeleteProjectTemplateRequest) {
  const response = await client["project-template"][":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default deleteProjectTemplate;
