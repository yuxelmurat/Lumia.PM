import { client } from "@kaneo/libs";

async function deletePermit(id: string) {
  const response = await client.permit.item[":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default deletePermit;
