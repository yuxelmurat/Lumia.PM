import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateSubmittal from "@/fetchers/submittal/update-submittal";

function useUpdateSubmittal(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubmittal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submittals", projectId] });
    },
  });
}

export default useUpdateSubmittal;
