import { client } from "@kaneo/libs";

async function createAssetPin({
  assetId,
  content,
  x,
  y,
  viewerState,
  label,
}: {
  assetId: string;
  content: string;
  x?: number;
  y?: number;
  viewerState?: unknown;
  label?: string;
}) {
  const response = await client["asset-pin"][":assetId"].$post({
    param: { assetId },
    json: { content, x, y, viewerState, label },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createAssetPin;
