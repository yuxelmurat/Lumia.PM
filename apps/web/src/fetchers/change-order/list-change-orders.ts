import { client } from "@kaneo/libs";

async function listChangeOrders(projectId: string) {
  const response = await client["change-order"][":projectId"].$get({
    param: { projectId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default listChangeOrders;
