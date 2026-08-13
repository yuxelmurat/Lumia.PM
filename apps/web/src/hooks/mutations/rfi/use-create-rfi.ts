import { useMutation, useQueryClient } from "@tanstack/react-query";
import createRfi from "@/fetchers/rfi/create-rfi";

function useCreateRfi(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRfi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfis", projectId] });
    },
  });
}

export default useCreateRfi;
