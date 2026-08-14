import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type GetProjectTemplatesByWorkspaceRequest = InferRequestType<
  (typeof client)["project-template"]["workspace"][":workspaceId"]["$get"]
>["param"];

async function getProjectTemplatesByWorkspace({
  workspaceId,
}: GetProjectTemplatesByWorkspaceRequest) {
  const response = await client["project-template"].workspace[
    ":workspaceId"
  ].$get({
    param: {
      workspaceId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default getProjectTemplatesByWorkspace;
