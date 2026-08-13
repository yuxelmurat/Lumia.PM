import { useMutation, useQueryClient } from "@tanstack/react-query";
import createSubmittal from "@/fetchers/submittal/create-submittal";

function useCreateSubmittal(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubmittal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submittals", projectId] });
    },
  });
}

export default useCreateSubmittal;
