import { useQuery } from "@tanstack/react-query";
import getPunchSummary from "@/fetchers/project/get-punch-summary";

function useGetPunchSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-punch-summary", projectId],
    queryFn: () => getPunchSummary(projectId as string),
    enabled: !!projectId,
  });
}

export default useGetPunchSummary;
