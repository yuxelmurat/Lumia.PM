import { useQuery } from "@tanstack/react-query";
import listRfis from "@/fetchers/rfi/list-rfis";

function useGetRfis(projectId: string | undefined) {
  return useQuery({
    queryKey: ["rfis", projectId],
    queryFn: () => listRfis(projectId as string),
    enabled: !!projectId,
  });
}

export default useGetRfis;
