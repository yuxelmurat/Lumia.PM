import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateProjectTemplate from "@/fetchers/project-template/update-project-template";

function useUpdateProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProjectTemplate,
    onSuccess: (updatedTemplate) => {
      void queryClient.invalidateQueries({
        queryKey: ["project-templates", updatedTemplate.workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["project-template", updatedTemplate.id],
      });
    },
  });
}

export default useUpdateProjectTemplate;
