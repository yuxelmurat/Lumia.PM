import { client } from "@kaneo/libs";

async function createPermit({
  projectId,
  jurisdictionName,
  permitType,
  notes,
  assigneeUserId,
}: {
  projectId: string;
  jurisdictionName: string;
  permitType?: string | null;
  notes?: string | null;
  assigneeUserId?: string | null;
}) {
  const response = await client.permit[":projectId"].$post({
    param: { projectId },
    json: { jurisdictionName, permitType, notes, assigneeUserId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createPermit;
