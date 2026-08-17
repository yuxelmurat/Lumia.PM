import { client } from "@kaneo/libs";

async function createAssetPinNote({
  pinId,
  content,
}: {
  pinId: string;
  content: string;
}) {
  const response = await client["asset-pin"].pin[":pinId"].notes.$post({
    param: { pinId },
    json: { content },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createAssetPinNote;
