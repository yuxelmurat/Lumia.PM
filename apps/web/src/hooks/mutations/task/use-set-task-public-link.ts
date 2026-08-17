import { useMutation, useQueryClient } from "@tanstack/react-query";
import setTaskPublicLink from "@/fetchers/task/set-task-public-link";

function useSetTaskPublicLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setTaskPublicLink,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
}

export default useSetTaskPublicLink;
