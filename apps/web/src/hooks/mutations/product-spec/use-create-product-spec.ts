import { useMutation, useQueryClient } from "@tanstack/react-query";
import createProductSpec from "@/fetchers/product-spec/create-product-spec";

function useCreateProductSpec(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductSpec,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product-specs", projectId],
      });
    },
  });
}

export default useCreateProductSpec;
