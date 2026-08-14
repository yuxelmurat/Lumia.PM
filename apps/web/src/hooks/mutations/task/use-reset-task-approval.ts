import { useMutation, useQueryClient } from "@tanstack/react-query";
import resetTaskApproval from "@/fetchers/task/reset-task-approval";

export function useResetTaskApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resetTaskApproval({ id }),
    onSuccess: (updatedTask, id) => {
      queryClient.invalidateQueries({
        queryKey: ["task", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", updatedTask.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["activities", id],
      });
    },
  });
}

export default useResetTaskApproval;
