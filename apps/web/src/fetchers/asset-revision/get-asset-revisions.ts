import { client } from "@kaneo/libs";

async function getAssetRevisions(assetId: string) {
  const response = await client["asset-revision"][":assetId"].chain.$get({
    param: { assetId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getAssetRevisions;
