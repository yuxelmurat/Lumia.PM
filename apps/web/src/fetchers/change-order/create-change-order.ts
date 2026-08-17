import { client } from "@kaneo/libs";

async function createChangeOrder({
  projectId,
  title,
  description,
  costImpactCents,
  hoursImpact,
}: {
  projectId: string;
  title: string;
  description: string;
  costImpactCents?: number | null;
  hoursImpact?: number | null;
}) {
  const response = await client["change-order"][":projectId"].$post({
    param: { projectId },
    json: { title, description, costImpactCents, hoursImpact },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createChangeOrder;
