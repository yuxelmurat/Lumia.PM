import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateChangeOrder from "@/fetchers/change-order/update-change-order";

function useUpdateChangeOrder(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChangeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["change-orders", projectId] });
    },
  });
}

export default useUpdateChangeOrder;
