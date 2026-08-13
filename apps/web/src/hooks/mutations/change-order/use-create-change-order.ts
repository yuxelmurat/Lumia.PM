import { useMutation, useQueryClient } from "@tanstack/react-query";
import createChangeOrder from "@/fetchers/change-order/create-change-order";

function useCreateChangeOrder(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChangeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-orders", projectId] });
    },
  });
}

export default useCreateChangeOrder;
