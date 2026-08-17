import { client } from "@kaneo/libs";

async function getPunchSummary(projectId: string) {
  const response = await client.project[":id"]["punch-summary"].$get({
    param: { id: projectId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getPunchSummary;
