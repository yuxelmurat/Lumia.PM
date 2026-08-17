import { useQuery } from "@tanstack/react-query";
import listSubmittals from "@/fetchers/submittal/list-submittals";

function useGetSubmittals(projectId: string | undefined) {
  return useQuery({
    queryKey: ["submittals", projectId],
    queryFn: () => listSubmittals(projectId as string),
    enabled: !!projectId,
  });
}

export default useGetSubmittals;
