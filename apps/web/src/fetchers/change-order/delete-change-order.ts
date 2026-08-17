import { client } from "@kaneo/libs";

async function deleteChangeOrder(id: string) {
  const response = await client["change-order"].item[":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default deleteChangeOrder;
