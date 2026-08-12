import { client } from "@kaneo/libs";

async function decidePublicApproval({
  token,
  guestId,
  decision,
  note,
}: {
  token: string;
  guestId: string;
  decision: "approved" | "changes_requested";
  note?: string;
}) {
  const response = await client["public-asset"][":token"].approval.$post({
    param: { token },
    json: { guestId, decision, note },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default decidePublicApproval;
