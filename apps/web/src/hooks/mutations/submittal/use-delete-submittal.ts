import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteSubmittal from "@/fetchers/submittal/delete-submittal";

function useDeleteSubmittal(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubmittal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submittals", projectId] });
    },
  });
}

export default useDeleteSubmittal;
