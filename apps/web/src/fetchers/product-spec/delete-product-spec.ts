import { client } from "@kaneo/libs";

async function deleteProductSpec(id: string) {
  const response = await client["product-spec"].item[":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default deleteProductSpec;
