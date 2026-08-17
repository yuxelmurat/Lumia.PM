import { client } from "@kaneo/libs";

async function listApprovalEvents(assetId: string) {
  const response = await client["asset-approval"][":assetId"].$get({
    param: { assetId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default listApprovalEvents;
