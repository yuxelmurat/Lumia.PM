import { client } from "@kaneo/libs";

async function requestApproval(assetId: string) {
  const response = await client["asset-approval"][":assetId"].$post({
    param: { assetId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default requestApproval;
