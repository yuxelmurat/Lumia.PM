import { useMutation, useQueryClient } from "@tanstack/react-query";
import createPublicAssetPin from "@/fetchers/public-asset/create-public-asset-pin";

function useCreatePublicAssetPin(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPublicAssetPin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-asset", token] });
    },
  });
}

export default useCreatePublicAssetPin;
