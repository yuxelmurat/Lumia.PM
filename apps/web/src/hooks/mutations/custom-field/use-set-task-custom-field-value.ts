import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SetTaskCustomFieldValueRequest } from "@/fetchers/custom-field/set-task-custom-field-value";
import setTaskCustomFieldValue from "@/fetchers/custom-field/set-task-custom-field-value";

function useSetTaskCustomFieldValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setTaskCustomFieldValue,
    onSuccess: (updatedValue, variables: SetTaskCustomFieldValueRequest) => {
      queryClient.setQueryData(
        ["custom-field-values", variables.taskId],
        (
          existingValues: Array<{ id: string; fieldId: string }> | undefined,
        ) => {
          if (!existingValues) return existingValues;

          const alreadyExists = existingValues.some(
            (value) => value.fieldId === updatedValue.fieldId,
          );

          return alreadyExists
            ? existingValues.map((value) =>
                value.fieldId === updatedValue.fieldId
                  ? { ...value, ...updatedValue }
                  : value,
              )
            : existingValues;
        },
      );

      void queryClient.invalidateQueries({
        queryKey: ["custom-field-values", variables.taskId],
      });
    },
  });
}

export default useSetTaskCustomFieldValue;
