import { client } from "@kaneo/libs";

async function getAssetTranslationStatus(assetId: string) {
  const response = await client["asset-aps"][":assetId"].status.$get({
    param: { assetId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getAssetTranslationStatus;
