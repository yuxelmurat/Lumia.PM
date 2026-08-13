import { client } from "@kaneo/libs";

async function completeProject(id: string) {
  const response = await client.project[":id"].complete.$put({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default completeProject;
