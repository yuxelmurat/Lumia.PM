import { resolveApiBaseUrl } from "@kaneo/libs";

export function getProductSpecImageUrl(imageAssetId: string | null) {
  if (!imageAssetId) return null;
  return `${resolveApiBaseUrl(import.meta.env.VITE_API_URL)}/asset/${imageAssetId}`;
}
