import { client } from "@kaneo/libs";

async function listSubmittals(projectId: string) {
  const response = await client.submittal[":projectId"].$get({
    param: { projectId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default listSubmittals;
