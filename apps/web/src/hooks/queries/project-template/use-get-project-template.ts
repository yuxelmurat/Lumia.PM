import { useQuery } from "@tanstack/react-query";
import getProjectTemplate from "@/fetchers/project-template/get-project-template";

function useGetProjectTemplate(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["project-template", id],
    queryFn: () => getProjectTemplate({ id }),
  });
}

export default useGetProjectTemplate;
