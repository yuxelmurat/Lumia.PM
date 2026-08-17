import { useQuery } from "@tanstack/react-query";
import getPublicTask from "@/fetchers/task/get-public-task";

function useGetPublicTask(token: string) {
  return useQuery({
    queryKey: ["public-task", token],
    queryFn: () => getPublicTask(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export default useGetPublicTask;
