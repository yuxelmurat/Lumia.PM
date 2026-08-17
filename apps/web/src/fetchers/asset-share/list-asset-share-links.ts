import { client } from "@kaneo/libs";

async function listAssetShareLinks(assetId: string) {
  const response = await client["asset-share"][":assetId"].$get({
    param: { assetId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default listAssetShareLinks;
