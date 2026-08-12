import { client } from "@kaneo/libs";

async function revokeAssetShareLink({ id }: { id: string }) {
  const response = await client["asset-share"][":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default revokeAssetShareLink;
