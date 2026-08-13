import { useMutation, useQueryClient } from "@tanstack/react-query";
import uncompleteProject from "@/fetchers/project/uncomplete-project";

function useUncompleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uncompleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export default useUncompleteProject;
