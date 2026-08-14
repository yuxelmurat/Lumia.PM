import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCustomFieldRequest } from "@/fetchers/custom-field/create-custom-field";
import createCustomField from "@/fetchers/custom-field/create-custom-field";

function useCreateCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomField,
    onSuccess: (createdField, variables: CreateCustomFieldRequest) => {
      queryClient.setQueryData(
        ["custom-fields", variables.workspaceId],
        (existingFields: Array<typeof createdField> | undefined) => {
          if (!existingFields) return [createdField];

          const alreadyExists = existingFields.some(
            (field) => field.id === createdField.id,
          );

          return alreadyExists
            ? existingFields
            : [...existingFields, createdField];
        },
      );

      void queryClient.invalidateQueries({
        queryKey: ["custom-fields", variables.workspaceId],
      });
    },
  });
}

export default useCreateCustomField;
