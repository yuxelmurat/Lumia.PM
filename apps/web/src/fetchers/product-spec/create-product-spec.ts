import { client } from "@kaneo/libs";

async function createProductSpec({
  projectId,
  roomLabel,
  name,
  vendor,
  unitCost,
  quantity,
  imageAssetId,
  linkedPinId,
  notes,
}: {
  projectId: string;
  roomLabel?: string;
  name: string;
  vendor?: string;
  unitCost?: number;
  quantity?: number;
  imageAssetId?: string;
  linkedPinId?: string;
  notes?: string;
}) {
  const response = await client["product-spec"][":projectId"].$post({
    param: { projectId },
    json: {
      roomLabel,
      name,
      vendor,
      unitCost,
      quantity,
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

export default createProductSpec;
