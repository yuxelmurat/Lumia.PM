import { client } from "@kaneo/libs";

async function decideApproval({
  assetId,
  decision,
  note,
}: {
  assetId: string;
  decision: "approved" | "changes_requested";
  note?: string;
}) {
  const response = await client["asset-approval"][":assetId"].decision.$post({
    param: { assetId },
    json: { decision, note },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default decideApproval;
