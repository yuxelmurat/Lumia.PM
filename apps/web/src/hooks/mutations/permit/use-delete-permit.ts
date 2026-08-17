import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePermit from "@/fetchers/permit/delete-permit";

function useDeletePermit(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePermit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permits", projectId] });
    },
  });
}

export default useDeletePermit;
