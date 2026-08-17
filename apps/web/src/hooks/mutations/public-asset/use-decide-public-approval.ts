import { useMutation, useQueryClient } from "@tanstack/react-query";
import decidePublicApproval from "@/fetchers/public-asset/decide-public-approval";

function useDecidePublicApproval(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: decidePublicApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-asset", token] });
    },
  });
}

export default useDecidePublicApproval;
