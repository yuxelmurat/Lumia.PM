import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteImagePin from "@/fetchers/task/delete-image-pin";

export function useDeleteImagePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteImagePin,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
}

export default useDeleteImagePin;
