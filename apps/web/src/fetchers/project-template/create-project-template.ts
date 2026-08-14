import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type CreateProjectTemplateRequest = InferRequestType<
  (typeof client)["project-template"]["$post"]
>["json"];

async function createProjectTemplate({
  workspaceId,
  name,
  description,
  icon,
  columns,
  tasks,
}: CreateProjectTemplateRequest) {
  const response = await client["project-template"].$post({
    json: {
      workspaceId,
      name,
      description,
      icon,
      columns,
      tasks,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default createProjectTemplate;
