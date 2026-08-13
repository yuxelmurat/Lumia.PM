import { useMutation, useQueryClient } from "@tanstack/react-query";
import createPermit from "@/fetchers/permit/create-permit";

function useCreatePermit(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPermit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permits", projectId] });
    },
  });
}

export default useCreatePermit;
