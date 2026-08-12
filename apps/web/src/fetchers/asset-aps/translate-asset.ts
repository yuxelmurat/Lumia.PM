import { client } from "@kaneo/libs";

async function translateAsset(assetId: string) {
  const response = await client["asset-aps"][":assetId"].translate.$post({
    param: { assetId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default translateAsset;
