import { useQuery } from "@tanstack/react-query";
import getPublicAssetTranslationStatus from "@/fetchers/public-asset/get-public-asset-translation-status";

function useGetPublicAssetTranslationStatus(token: string | undefined) {
  return useQuery({
    queryKey: ["public-asset-translation-status", token],
    queryFn: () => getPublicAssetTranslationStatus(token as string),
    enabled: !!token,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "inprogress" ? 3000 : false;
    },
  });
}

export default useGetPublicAssetTranslationStatus;
