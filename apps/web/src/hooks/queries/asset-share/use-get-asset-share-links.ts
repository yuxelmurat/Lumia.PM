import { useQuery } from "@tanstack/react-query";
import listAssetShareLinks from "@/fetchers/asset-share/list-asset-share-links";

function useGetAssetShareLinks(assetId: string | undefined) {
  return useQuery({
    queryKey: ["asset-share-links", assetId],
    queryFn: () => listAssetShareLinks(assetId as string),
    enabled: !!assetId,
  });
}

export default useGetAssetShareLinks;
