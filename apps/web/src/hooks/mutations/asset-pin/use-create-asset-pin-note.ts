import { useMutation, useQueryClient } from "@tanstack/react-query";
import createAssetPinNote from "@/fetchers/asset-pin/create-asset-pin-note";

function useCreateAssetPinNote(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssetPinNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-pins", assetId] });
    },
  });
}

export default useCreateAssetPinNote;
