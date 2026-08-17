import { client } from "@kaneo/libs";

async function listProductSpecs(projectId: string) {
  const response = await client["product-spec"][":projectId"].$get({
    param: { projectId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default listProductSpecs;
