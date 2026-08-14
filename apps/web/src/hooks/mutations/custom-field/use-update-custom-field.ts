import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateCustomField from "@/fetchers/custom-field/update-custom-field";

function useUpdateCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCustomField,
    onSuccess: (_updatedField) => {
      void queryClient.invalidateQueries({
        queryKey: ["custom-fields"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["custom-field-values"],
      });
    },
  });
}

export default useUpdateCustomField;
