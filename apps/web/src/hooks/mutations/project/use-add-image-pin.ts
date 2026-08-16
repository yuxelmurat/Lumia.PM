import { useMutation, useQueryClient } from "@tanstack/react-query";
import addImagePin from "@/fetchers/project/add-image-pin";

function useAddImagePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addImagePin,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["public-project", variables.projectId],
      });
    },
  });
}

export default useAddImagePin;
