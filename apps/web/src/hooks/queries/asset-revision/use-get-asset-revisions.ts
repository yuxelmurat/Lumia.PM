import { useQuery } from "@tanstack/react-query";
import getAssetRevisions from "@/fetchers/asset-revision/get-asset-revisions";

function useGetAssetRevisions(assetId: string | undefined) {
  return useQuery({
    queryKey: ["asset-revisions", assetId],
    queryFn: () => getAssetRevisions(assetId as string),
    enabled: !!assetId,
  });
}

export default useGetAssetRevisions;
