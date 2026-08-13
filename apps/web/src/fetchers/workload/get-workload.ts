import { client } from "@kaneo/libs";

async function getWorkload(workspaceId: string) {
  const response = await client.workload[":workspaceId"].$get({
    param: { workspaceId },
    query: {},
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getWorkload;
