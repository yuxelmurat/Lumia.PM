import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteChangeOrder from "@/fetchers/change-order/delete-change-order";

function useDeleteChangeOrder(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChangeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-orders", projectId] });
    },
  });
}

export default useDeleteChangeOrder;
