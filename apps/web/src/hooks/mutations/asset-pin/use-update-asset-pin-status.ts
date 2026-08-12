import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateAssetPinStatus from "@/fetchers/asset-pin/update-asset-pin-status";

function useUpdateAssetPinStatus(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAssetPinStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-pins", assetId] });
    },
  });
}

export default useUpdateAssetPinStatus;
