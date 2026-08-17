import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateTaskEstimatedHours from "@/fetchers/task/update-task-estimated-hours";
import type Task from "@/types/task";

export function useUpdateTaskEstimatedHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      task,
      estimatedHours,
    }: {
      task: Task;
      estimatedHours: number | null;
    }) => updateTaskEstimatedHours(task.id, estimatedHours),
    onSuccess: (_, { task }) => {
      queryClient.invalidateQueries({
        queryKey: ["task", task.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", task.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workload"],
      });
    },
  });
}
