import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type GetCustomFieldsByWorkspaceRequest = InferRequestType<
  (typeof client)["custom-field"]["workspace"][":workspaceId"]["$get"]
>["param"];

async function getCustomFieldsByWorkspace({
  workspaceId,
}: GetCustomFieldsByWorkspaceRequest) {
  const response = await client["custom-field"].workspace[":workspaceId"].$get({
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

export default getCustomFieldsByWorkspace;
