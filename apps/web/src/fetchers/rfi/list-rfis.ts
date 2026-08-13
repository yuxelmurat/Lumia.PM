import { client } from "@kaneo/libs";

async function listRfis(projectId: string) {
  const response = await client.rfi[":projectId"].$get({
    param: { projectId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default listRfis;
