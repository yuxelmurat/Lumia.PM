import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateImagePin from "@/fetchers/task/update-image-pin";

export function useUpdateImagePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateImagePin,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
}

export default useUpdateImagePin;
