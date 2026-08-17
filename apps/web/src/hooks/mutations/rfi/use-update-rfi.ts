import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateRfi from "@/fetchers/rfi/update-rfi";

function useUpdateRfi(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRfi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfis", projectId] });
    },
  });
}

export default useUpdateRfi;
