import { useMutation, useQueryClient } from "@tanstack/react-query";
import createAssetShareLink from "@/fetchers/asset-share/create-asset-share-link";

function useCreateAssetShareLink(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssetShareLink,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asset-share-links", assetId],
      });
    },
  });
}

export default useCreateAssetShareLink;
