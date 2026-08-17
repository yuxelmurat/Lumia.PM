import { fetchPinsByAssetId } from "./pin-queries";

async function listPins(assetId: string) {
  return fetchPinsByAssetId(assetId);
}

export default listPins;
