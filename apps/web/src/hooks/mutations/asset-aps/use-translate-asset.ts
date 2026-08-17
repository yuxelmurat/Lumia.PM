import { useMutation, useQueryClient } from "@tanstack/react-query";
import translateAsset from "@/fetchers/asset-aps/translate-asset";

function useTranslateAsset(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => translateAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asset-translation-status", assetId],
      });
    },
  });
}

export default useTranslateAsset;
