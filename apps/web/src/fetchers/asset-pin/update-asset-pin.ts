import { client } from "@kaneo/libs";

async function updateAssetPin({
  pinId,
  status,
  isPunchItem,
  assigneeUserId,
  dueDate,
}: {
  pinId: string;
  status?: "open" | "resolved";
  isPunchItem?: boolean;
  assigneeUserId?: string | null;
  dueDate?: string | null;
}) {
  const response = await client["asset-pin"].pin[":pinId"].$patch({
    param: { pinId },
    json: { status, isPunchItem, assigneeUserId, dueDate },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateAssetPin;
