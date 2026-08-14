import { useQuery } from "@tanstack/react-query";
import getTaskCustomFieldValues from "@/fetchers/custom-field/get-task-custom-field-values";

function useGetTaskCustomFieldValues(taskId: string) {
  return useQuery({
    enabled: Boolean(taskId),
    queryKey: ["custom-field-values", taskId],
    queryFn: () => getTaskCustomFieldValues({ taskId }),
    refetchOnMount: true,
  });
}

export default useGetTaskCustomFieldValues;
