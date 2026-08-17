import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteProductSpec from "@/fetchers/product-spec/delete-product-spec";

function useDeleteProductSpec(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProductSpec,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-specs", projectId],
      });
    },
  });
}

export default useDeleteProductSpec;
