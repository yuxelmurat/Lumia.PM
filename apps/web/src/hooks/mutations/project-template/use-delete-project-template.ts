import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteProjectTemplate from "@/fetchers/project-template/delete-project-template";

function useDeleteProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProjectTemplate,
    onSuccess: (deletedTemplate) => {
      queryClient.setQueryData(
        ["project-templates", deletedTemplate.workspaceId],
        (existingTemplates: Array<{ id: string }> | undefined) =>
          existingTemplates?.filter(
            (template) => template.id !== deletedTemplate.id,
          ) ?? [],
      );

      void queryClient.invalidateQueries({
        queryKey: ["project-templates", deletedTemplate.workspaceId],
      });
    },
  });
}

export default useDeleteProjectTemplate;
