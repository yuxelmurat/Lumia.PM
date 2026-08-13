import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateAssetPin from "@/fetchers/asset-pin/update-asset-pin";

function useUpdateAssetPin(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAssetPin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-pins", assetId] });
    },
  });
}

export default useUpdateAssetPin;
