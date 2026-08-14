import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type GetProjectTemplateRequest = InferRequestType<
  (typeof client)["project-template"][":id"]["$get"]
>["param"];

async function getProjectTemplate({ id }: GetProjectTemplateRequest) {
  const response = await client["project-template"][":id"].$get({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default getProjectTemplate;
