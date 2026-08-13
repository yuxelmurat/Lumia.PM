import { client } from "@kaneo/libs";

async function uncompleteProject(id: string) {
  const response = await client.project[":id"].uncomplete.$put({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default uncompleteProject;
