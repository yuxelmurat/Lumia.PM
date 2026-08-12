import { client } from "@kaneo/libs";

async function createPublicAssetPin({
  token,
  guestId,
  content,
  x,
  y,
  viewerState,
  label,
}: {
  token: string;
  guestId: string;
  content: string;
  x?: number;
  y?: number;
  viewerState?: unknown;
  label?: string;
}) {
  const response = await client["public-asset"][":token"].pins.$post({
    param: { token },
    json: { guestId, content, x, y, viewerState, label },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createPublicAssetPin;
