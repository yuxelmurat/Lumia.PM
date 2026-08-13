import { useMutation, useQueryClient } from "@tanstack/react-query";
import completeProject from "@/fetchers/project/complete-project";

function useCompleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export default useCompleteProject;
