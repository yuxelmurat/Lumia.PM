import { useMutation, useQueryClient } from "@tanstack/react-query";
import createProjectTemplate from "@/fetchers/project-template/create-project-template";

function useCreateProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProjectTemplate,
    onSuccess: (createdTemplate) => {
      void queryClient.invalidateQueries({
        queryKey: ["project-templates", createdTemplate.workspaceId],
      });
    },
  });
}

export default useCreateProjectTemplate;
