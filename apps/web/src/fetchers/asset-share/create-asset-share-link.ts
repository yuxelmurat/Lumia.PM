import { client } from "@kaneo/libs";

async function createAssetShareLink({
  assetId,
  expiresAt,
}: {
  assetId: string;
  expiresAt?: string | null;
}) {
  const response = await client["asset-share"][":assetId"].$post({
    param: { assetId },
    json: { expiresAt: expiresAt ?? undefined },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createAssetShareLink;
