import { useQuery } from "@tanstack/react-query";
import getWorkload from "@/fetchers/workload/get-workload";

export function useGetWorkload(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workload", workspaceId],
    queryFn: () => getWorkload(workspaceId as string),
    enabled: !!workspaceId,
  });
}
