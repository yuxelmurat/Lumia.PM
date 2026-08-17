import { useMutation, useQueryClient } from "@tanstack/react-query";
import addImagePinByToken from "@/fetchers/task/add-image-pin-by-token";

function useAddImagePinByToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addImagePinByToken,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["public-task", variables.token],
      });
    },
  });
}

export default useAddImagePinByToken;
