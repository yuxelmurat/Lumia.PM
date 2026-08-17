import { useMutation, useQueryClient } from "@tanstack/react-query";
import regenerateTaskPublicLink from "@/fetchers/task/regenerate-task-public-link";

function useRegenerateTaskPublicLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regenerateTaskPublicLink,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
}

export default useRegenerateTaskPublicLink;
