import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DeleteTaskCustomFieldValueRequest } from "@/fetchers/custom-field/delete-task-custom-field-value";
import deleteTaskCustomFieldValue from "@/fetchers/custom-field/delete-task-custom-field-value";

function useDeleteTaskCustomFieldValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTaskCustomFieldValue,
    onSuccess: (deletedValue, variables: DeleteTaskCustomFieldValueRequest) => {
      queryClient.setQueryData(
        ["custom-field-values", variables.taskId],
        (existingValues: Array<{ fieldId: string }> | undefined) =>
          existingValues?.filter(
            (value) => value.fieldId !== deletedValue.fieldId,
          ) ?? [],
      );

      void queryClient.invalidateQueries({
        queryKey: ["custom-field-values", variables.taskId],
      });
    },
  });
}

export default useDeleteTaskCustomFieldValue;
