import { useQuery } from "@tanstack/react-query";
import listAssetPins from "@/fetchers/asset-pin/list-asset-pins";

function useGetAssetPins(assetId: string | undefined) {
  return useQuery({
    queryKey: ["asset-pins", assetId],
    queryFn: () => listAssetPins(assetId as string),
    enabled: !!assetId,
  });
}

export default useGetAssetPins;
