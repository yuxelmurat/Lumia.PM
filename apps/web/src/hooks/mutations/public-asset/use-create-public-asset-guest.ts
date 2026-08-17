import { useMutation } from "@tanstack/react-query";
import createPublicAssetGuest from "@/fetchers/public-asset/create-public-asset-guest";

function useCreatePublicAssetGuest() {
  return useMutation({
    mutationFn: createPublicAssetGuest,
  });
}

export default useCreatePublicAssetGuest;
