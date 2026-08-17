import { client } from "@kaneo/libs";

async function getPublicAssetViewerToken(token: string) {
  const response = await client["public-asset"][":token"][
    "aps-viewer-token"
  ].$get({
    param: { token },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json() as Promise<{ accessToken: string; expiresIn: number }>;
}

export default getPublicAssetViewerToken;
