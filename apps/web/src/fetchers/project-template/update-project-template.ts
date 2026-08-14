import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type UpdateProjectTemplateRequest = InferRequestType<
  (typeof client)["project-template"][":id"]["$put"]
>["json"] &
  InferRequestType<(typeof client)["project-template"][":id"]["$put"]>["param"];

async function updateProjectTemplate({
  id,
  name,
  description,
  icon,
  columns,
  tasks,
}: UpdateProjectTemplateRequest) {
  const response = await client["project-template"][":id"].$put({
    param: { id },
    json: { name, description, icon, columns, tasks },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();
  return data;
}

export default updateProjectTemplate;
