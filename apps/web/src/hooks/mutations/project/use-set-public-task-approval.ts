import { useMutation, useQueryClient } from "@tanstack/react-query";
import setPublicTaskApproval from "@/fetchers/project/set-public-task-approval";

function useSetPublicTaskApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setPublicTaskApproval,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["public-project", variables.projectId],
      });
    },
  });
}

export default useSetPublicTaskApproval;
