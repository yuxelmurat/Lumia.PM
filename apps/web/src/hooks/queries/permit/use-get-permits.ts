import { useQuery } from "@tanstack/react-query";
import listPermits from "@/fetchers/permit/list-permits";

function useGetPermits(projectId: string | undefined) {
  return useQuery({
    queryKey: ["permits", projectId],
    queryFn: () => listPermits(projectId as string),
    enabled: !!projectId,
  });
}

export default useGetPermits;
