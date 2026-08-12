import { useQuery } from "@tanstack/react-query";
import listApprovalEvents from "@/fetchers/asset-approval/list-approval-events";

function useGetApprovalEvents(assetId: string | undefined) {
  return useQuery({
    queryKey: ["asset-approval-events", assetId],
    queryFn: () => listApprovalEvents(assetId as string),
    enabled: !!assetId,
  });
}

export default useGetApprovalEvents;
