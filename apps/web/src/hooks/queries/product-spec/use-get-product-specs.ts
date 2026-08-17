import { useQuery } from "@tanstack/react-query";
import listProductSpecs from "@/fetchers/product-spec/list-product-specs";

function useGetProductSpecs(projectId: string | undefined) {
  return useQuery({
    queryKey: ["product-specs", projectId],
    queryFn: () => listProductSpecs(projectId as string),
    enabled: !!projectId,
  });
}

export default useGetProductSpecs;
