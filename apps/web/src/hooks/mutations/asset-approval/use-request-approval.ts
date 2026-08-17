import { useMutation, useQueryClient } from "@tanstack/react-query";
import requestApproval from "@/fetchers/asset-approval/request-approval";

function useRequestApproval(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requestApproval(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asset-approval-events", assetId],
      });
    },
  });
}

export default useRequestApproval;
