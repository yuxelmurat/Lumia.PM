import { useQuery } from "@tanstack/react-query";
import getProjectTemplatesByWorkspace from "@/fetchers/project-template/get-project-templates-by-workspace";

function useGetProjectTemplatesByWorkspace(workspaceId: string) {
  return useQuery({
    enabled: Boolean(workspaceId),
    queryKey: ["project-templates", workspaceId],
    queryFn: () => getProjectTemplatesByWorkspace({ workspaceId }),
  });
}

export default useGetProjectTemplatesByWorkspace;
