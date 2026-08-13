import { useMutation } from "@tanstack/react-query";
import createProject from "@/fetchers/project/create-project";

function useCreateProject({
  name,
  slug,
  workspaceId,
  icon,
  projectType,
}: {
  name: string;
  slug: string;
  workspaceId: string;
  icon: string;
  projectType?: "generic" | "architecture" | "interior_design";
}) {
  return useMutation({
    mutationFn: () =>
      createProject({ name, slug, workspaceId, icon, projectType }),
  });
}

export default useCreateProject;
