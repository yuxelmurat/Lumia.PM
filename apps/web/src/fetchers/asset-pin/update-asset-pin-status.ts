import { client } from "@kaneo/libs";

async function updateAssetPinStatus({
  pinId,
  status,
}: {
  pinId: string;
  status: "open" | "resolved";
}) {
  const response = await client["asset-pin"].pin[":pinId"].$patch({
    param: { pinId },
    json: { status },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateAssetPinStatus;
