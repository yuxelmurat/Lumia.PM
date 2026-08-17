import { client } from "@kaneo/libs";

async function getAssetViewerToken(assetId: string) {
  const response = await client["asset-aps"][":assetId"]["viewer-token"].$get({
    param: { assetId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json() as Promise<{ accessToken: string; expiresIn: number }>;
}

export default getAssetViewerToken;
