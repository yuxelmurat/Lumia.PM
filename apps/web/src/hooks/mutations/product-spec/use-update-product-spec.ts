import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateProductSpec from "@/fetchers/product-spec/update-product-spec";

function useUpdateProductSpec(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProductSpec,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-specs", projectId],
      });
    },
  });
}

export default useUpdateProductSpec;
