import { useQuery } from "@tanstack/react-query";
import getPublicAsset from "@/fetchers/public-asset/get-public-asset";

function useGetPublicAsset(token: string | undefined) {
  return useQuery({
    queryKey: ["public-asset", token],
    queryFn: () => getPublicAsset(token as string),
    enabled: !!token,
    retry: false,
  });
}

export default useGetPublicAsset;
