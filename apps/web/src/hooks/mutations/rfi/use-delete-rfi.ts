import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteRfi from "@/fetchers/rfi/delete-rfi";

function useDeleteRfi(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRfi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfis", projectId] });
    },
  });
}

export default useDeleteRfi;
