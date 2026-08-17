import { useQuery } from "@tanstack/react-query";
import listChangeOrders from "@/fetchers/change-order/list-change-orders";

function useGetChangeOrders(projectId: string | undefined) {
  return useQuery({
    queryKey: ["change-orders", projectId],
    queryFn: () => listChangeOrders(projectId as string),
    enabled: !!projectId,
  });
}

export default useGetChangeOrders;
