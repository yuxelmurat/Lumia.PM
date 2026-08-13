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
  poNumber,
  expectedShipDate,
  actualShipDate,
  trackingNumber,
  carrier,
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
  poNumber?: string | null;
  expectedShipDate?: string | null;
  actualShipDate?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
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
      poNumber,
      expectedShipDate,
      actualShipDate,
      trackingNumber,
      carrier,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateProductSpec;
