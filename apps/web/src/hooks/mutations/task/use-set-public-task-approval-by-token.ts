import { useMutation, useQueryClient } from "@tanstack/react-query";
import setPublicTaskApprovalByToken from "@/fetchers/task/set-public-task-approval-by-token";

function useSetPublicTaskApprovalByToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setPublicTaskApprovalByToken,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["public-task", variables.token],
      });
    },
  });
}

export default useSetPublicTaskApprovalByToken;
