import { useMutation, useQueryClient } from "@tanstack/react-query";
import createAssetPin from "@/fetchers/asset-pin/create-asset-pin";

function useCreateAssetPin(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssetPin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-pins", assetId] });
    },
  });
}

export default useCreateAssetPin;
