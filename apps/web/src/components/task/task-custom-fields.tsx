import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useDeleteTaskCustomFieldValue from "@/hooks/mutations/custom-field/use-delete-task-custom-field-value";
import useSetTaskCustomFieldValue from "@/hooks/mutations/custom-field/use-set-task-custom-field-value";
import useGetCustomFieldsByWorkspace from "@/hooks/queries/custom-field/use-get-custom-fields-by-workspace";
import useGetTaskCustomFieldValues from "@/hooks/queries/custom-field/use-get-task-custom-field-values";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";

type CustomFieldType = "text" | "number" | "date" | "select" | "checkbox";

type CustomFieldDefinition = {
  id: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  isRequired: boolean;
};

type TaskCustomFieldsProps = {
  taskId: string;
  workspaceId: string;
};

// The server's OpenAPI-derived value type is a generic JSON value; narrow it
// to the shape the controls actually render (server already validates the
// value against the field's type before persisting it).
function normalizeValue(
  value: unknown,
): string | number | boolean | string[] | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return null;
}

export default function TaskCustomFields({
  taskId,
  workspaceId,
}: TaskCustomFieldsProps) {
  const { t } = useTranslation();
  const { canManageTasks } = useWorkspacePermission();
  const canEdit = canManageTasks();

  const { data: fields = [] } = useGetCustomFieldsByWorkspace(workspaceId);
  const { data: values = [] } = useGetTaskCustomFieldValues(taskId);

  const setValue = useSetTaskCustomFieldValue();
  const clearValue = useDeleteTaskCustomFieldValue();

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:flex px-3 flex-col gap-3 p-2">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-foreground/70 px-2">
          {t("tasks:customFields.title", { defaultValue: "Custom Fields" })}
        </span>
        <div className="flex flex-col gap-2 px-2">
          {fields.map((field) => {
            const existingValue = values.find(
              (value) => value.fieldId === field.id,
            );
            return (
              <CustomFieldControl
                key={field.id}
                field={field as CustomFieldDefinition}
                value={normalizeValue(existingValue?.value)}
                disabled={!canEdit}
                onSave={async (value) => {
                  try {
                    await setValue.mutateAsync({
                      taskId,
                      fieldId: field.id,
                      value,
                    });
                    toast.success(
                      t("tasks:customFields.updateSuccess", {
                        defaultValue: "Custom field updated",
                      }),
                    );
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : t("tasks:customFields.updateError", {
                            defaultValue: "Failed to update custom field",
                          }),
                    );
                  }
                }}
                onClear={async () => {
                  try {
                    await clearValue.mutateAsync({
                      taskId,
                      fieldId: field.id,
                    });
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : t("tasks:customFields.updateError", {
                            defaultValue: "Failed to update custom field",
                          }),
                    );
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

type CustomFieldControlProps = {
  field: CustomFieldDefinition;
  value: string | number | boolean | string[] | null;
  disabled: boolean;
  onSave: (value: string | number | boolean | string[]) => Promise<void>;
  onClear: () => Promise<void>;
};

function CustomFieldControl({
  field,
  value,
  disabled,
  onSave,
  onClear,
}: CustomFieldControlProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const label = (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground truncate">
        {field.name}
        {field.isRequired && <span className="text-destructive"> *</span>}
      </span>
      {value !== null && value !== "" && !disabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0"
          onClick={() => onClear()}
          aria-label={t("tasks:customFields.clear", {
            defaultValue: "Clear value",
          })}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );

  if (field.type === "checkbox") {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={Boolean(value)}
            disabled={disabled}
            onCheckedChange={(checked) => onSave(checked === true)}
          />
        </div>
      </div>
    );
  }

  if (field.type === "select") {
    const currentValue = typeof value === "string" ? value : "";
    return (
      <div className="flex flex-col gap-1">
        {label}
        <Select
          value={currentValue}
          disabled={disabled}
          onValueChange={(next) => {
            if (next) onSave(next);
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue
              placeholder={t("tasks:customFields.selectPlaceholder", {
                defaultValue: "Select...",
              })}
            >
              {currentValue || null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const inputType =
    field.type === "number"
      ? "number"
      : field.type === "date"
        ? "date"
        : "text";

  const handleBlur = () => {
    if (draft === "" || draft === null) {
      if (value !== null && value !== "") {
        onClear();
      }
      return;
    }

    if (draft === value) return;

    if (field.type === "number") {
      const numeric = Number(draft);
      if (!Number.isNaN(numeric)) {
        onSave(numeric);
      }
      return;
    }

    onSave(String(draft));
  };

  return (
    <div className="flex flex-col gap-1">
      {label}
      <Input
        className="h-8 text-sm"
        type={inputType}
        value={typeof draft === "boolean" ? "" : draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        placeholder={
          disabled
            ? t("tasks:customFields.noValue", { defaultValue: "No value" })
            : undefined
        }
      />
    </div>
  );
}
