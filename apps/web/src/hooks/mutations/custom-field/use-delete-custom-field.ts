import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteCustomField from "@/fetchers/custom-field/delete-custom-field";

function useDeleteCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomField,
    onSuccess: (deletedField) => {
      queryClient.setQueryData(
        ["custom-fields", deletedField.workspaceId],
        (existingFields: Array<typeof deletedField> | undefined) =>
          existingFields?.filter((field) => field.id !== deletedField.id) ?? [],
      );

      void queryClient.invalidateQueries({
        queryKey: ["custom-fields", deletedField.workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["custom-field-values"],
      });
    },
  });
}

export default useDeleteCustomField;
