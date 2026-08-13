import { useMutation, useQueryClient } from "@tanstack/react-query";
import updatePermit from "@/fetchers/permit/update-permit";

function useUpdatePermit(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePermit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permits", projectId] });
    },
  });
}

export default useUpdatePermit;
