import { useMutation, useQueryClient } from "@tanstack/react-query";
import createPublicAssetPinNote from "@/fetchers/public-asset/create-public-asset-pin-note";

function useCreatePublicAssetPinNote(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPublicAssetPinNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-asset", token] });
    },
  });
}

export default useCreatePublicAssetPinNote;
