import { useQuery } from "@tanstack/react-query";
import getDashboardSummary from "@/fetchers/dashboard/get-dashboard-summary";

export function useDashboardSummary(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-summary", workspaceId],
    queryFn: () => getDashboardSummary(workspaceId as string),
    enabled: !!workspaceId,
  });
}
