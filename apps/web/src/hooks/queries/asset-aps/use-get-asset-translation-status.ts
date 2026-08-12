import { useQuery } from "@tanstack/react-query";
import getAssetTranslationStatus from "@/fetchers/asset-aps/get-translation-status";

function useGetAssetTranslationStatus(assetId: string | undefined) {
  return useQuery({
    queryKey: ["asset-translation-status", assetId],
    queryFn: () => getAssetTranslationStatus(assetId as string),
    enabled: !!assetId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "inprogress" ? 3000 : false;
    },
  });
}

export default useGetAssetTranslationStatus;
