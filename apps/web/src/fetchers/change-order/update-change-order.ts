import { client } from "@kaneo/libs";

async function updateChangeOrder({
  id,
  title,
  description,
  costImpactCents,
  hoursImpact,
  status,
  decisionNote,
}: {
  id: string;
  title?: string;
  description?: string;
  costImpactCents?: number | null;
  hoursImpact?: number | null;
  status?: "pending_review" | "approved" | "rejected";
  decisionNote?: string | null;
}) {
  const response = await client["change-order"].item[":id"].$patch({
    param: { id },
    json: {
      title,
      description,
      costImpactCents,
      hoursImpact,
      status,
      decisionNote,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateChangeOrder;
