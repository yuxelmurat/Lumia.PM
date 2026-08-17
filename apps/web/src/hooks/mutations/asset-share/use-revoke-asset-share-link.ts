import { useMutation, useQueryClient } from "@tanstack/react-query";
import revokeAssetShareLink from "@/fetchers/asset-share/revoke-asset-share-link";

function useRevokeAssetShareLink(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeAssetShareLink,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asset-share-links", assetId],
      });
    },
  });
}

export default useRevokeAssetShareLink;
