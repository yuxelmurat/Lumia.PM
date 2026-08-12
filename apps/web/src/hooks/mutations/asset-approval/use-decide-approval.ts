import { useMutation, useQueryClient } from "@tanstack/react-query";
import decideApproval from "@/fetchers/asset-approval/decide-approval";

function useDecideApproval(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: decideApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asset-approval-events", assetId],
      });
    },
  });
}

export default useDecideApproval;
