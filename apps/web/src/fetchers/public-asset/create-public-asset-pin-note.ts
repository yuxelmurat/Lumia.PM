import { client } from "@kaneo/libs";

async function createPublicAssetPinNote({
  token,
  pinId,
  guestId,
  content,
}: {
  token: string;
  pinId: string;
  guestId: string;
  content: string;
}) {
  const response = await client["public-asset"][":token"].pins[
    ":pinId"
  ].notes.$post({
    param: { token, pinId },
    json: { guestId, content },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createPublicAssetPinNote;
