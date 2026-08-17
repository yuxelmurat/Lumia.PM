import { client } from "@kaneo/libs";

async function listAssetPins(assetId: string) {
  const response = await client["asset-pin"][":assetId"].$get({
    param: { assetId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default listAssetPins;
