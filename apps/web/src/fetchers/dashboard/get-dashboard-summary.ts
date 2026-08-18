import { client } from "@kaneo/libs";

async function getDashboardSummary(workspaceId: string) {
  const response = await client.dashboard[":workspaceId"].$get({
    param: { workspaceId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getDashboardSummary;
