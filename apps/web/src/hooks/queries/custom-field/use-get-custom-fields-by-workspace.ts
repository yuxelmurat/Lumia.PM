import { useQuery } from "@tanstack/react-query";
import getCustomFieldsByWorkspace from "@/fetchers/custom-field/get-custom-fields-by-workspace";

function useGetCustomFieldsByWorkspace(workspaceId: string) {
  return useQuery({
    enabled: Boolean(workspaceId),
    queryKey: ["custom-fields", workspaceId],
    queryFn: () => getCustomFieldsByWorkspace({ workspaceId }),
  });
}

export default useGetCustomFieldsByWorkspace;
