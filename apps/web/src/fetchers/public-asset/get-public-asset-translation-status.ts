import { client } from "@kaneo/libs";

async function getPublicAssetTranslationStatus(token: string) {
  const response = await client["public-asset"][":token"]["aps-status"].$get({
    param: { token },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getPublicAssetTranslationStatus;
