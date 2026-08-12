import { client } from "@kaneo/libs";

async function updateProductSpec({
  id,
  roomLabel,
  name,
  vendor,
  unitCost,
  quantity,
  status,
  imageAssetId,
  linkedPinId,
  notes,
}: {
  id: string;
  roomLabel?: string | null;
  name?: string;
  vendor?: string | null;
  unitCost?: number | null;
  quantity?: number;
  status?:
    | "proposed"
    | "client_approved"
    | "ordered"
    | "received"
    | "installed";
  imageAssetId?: string | null;
  linkedPinId?: string | null;
  notes?: string | null;
}) {
  const response = await client["product-spec"].item[":id"].$put({
    param: { id },
    json: {
      roomLabel,
      name,
      vendor,
      unitCost,
      quantity,
      status,
      imageAssetId,
      linkedPinId,
      notes,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateProductSpec;
