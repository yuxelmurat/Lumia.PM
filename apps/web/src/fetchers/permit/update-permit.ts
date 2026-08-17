import { client } from "@kaneo/libs";

async function updatePermit({
  id,
  jurisdictionName,
  permitType,
  status,
  permitNumber,
  submittedDate,
  approvalDate,
  notes,
  assigneeUserId,
}: {
  id: string;
  jurisdictionName?: string;
  permitType?: string | null;
  status?:
    | "not_submitted"
    | "submitted"
    | "corrections_required"
    | "approved"
    | "issued";
  permitNumber?: string | null;
  submittedDate?: string | null;
  approvalDate?: string | null;
  notes?: string | null;
  assigneeUserId?: string | null;
}) {
  const response = await client.permit.item[":id"].$patch({
    param: { id },
    json: {
      jurisdictionName,
      permitType,
      status,
      permitNumber,
      submittedDate,
      approvalDate,
      notes,
      assigneeUserId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updatePermit;
