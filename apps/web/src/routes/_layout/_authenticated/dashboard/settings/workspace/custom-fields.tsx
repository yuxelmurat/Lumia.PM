import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageTitle from "@/components/page-title";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useCreateCustomField from "@/hooks/mutations/custom-field/use-create-custom-field";
import useDeleteCustomField from "@/hooks/mutations/custom-field/use-delete-custom-field";
import useUpdateCustomField from "@/hooks/mutations/custom-field/use-update-custom-field";
import useGetCustomFieldsByWorkspace from "@/hooks/queries/custom-field/use-get-custom-fields-by-workspace";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/workspace/custom-fields",
)({
  component: RouteComponent,
});

type CustomFieldType = "text" | "number" | "date" | "select" | "checkbox";

const FIELD_TYPES: CustomFieldType[] = [
  "text",
  "number",
  "date",
  "select",
  "checkbox",
];

type FieldFormState = {
  name: string;
  type: CustomFieldType;
  options: string[];
  isRequired: boolean;
};

const emptyForm: FieldFormState = {
  name: "",
  type: "text",
  options: [],
  isRequired: false,
};

function RouteComponent() {
  const { t } = useTranslation();
  const { workspace, canManageCustomFields } = useWorkspacePermission();
  const canEdit = canManageCustomFields();

  const workspaceId = workspace?.id ?? "";

  const { data: fields = [] } = useGetCustomFieldsByWorkspace(workspaceId);

  const createCustomField = useCreateCustomField();
  const updateCustomField = useUpdateCustomField();
  const deleteCustomField = useDeleteCustomField();

  const typeLabel = (type: CustomFieldType) =>
    t(`settings:workspaceCustomFields.types.${type}`, {
      defaultValue: type,
    });

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FieldFormState>(emptyForm);
  const [createError, setCreateError] = useState("");

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FieldFormState>(emptyForm);
  const [editError, setEditError] = useState("");

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingField, setDeletingField] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const resetCreate = () => {
    setCreateForm(emptyForm);
    setCreateError("");
  };

  const openCreate = () => {
    resetCreate();
    setCreateOpen(true);
  };

  const validateForm = (form: FieldFormState) => {
    if (!form.name.trim()) {
      return t("settings:workspaceCustomFields.nameRequired", {
        defaultValue: "Field name is required",
      });
    }
    if (
      form.type === "select" &&
      form.options.filter((option) => option.trim()).length === 0
    ) {
      return t("settings:workspaceCustomFields.optionsRequired", {
        defaultValue: "At least one option is required for select fields",
      });
    }
    return "";
  };

  const handleCreate = async () => {
    const error = validateForm(createForm);
    if (error) {
      setCreateError(error);
      return;
    }

    try {
      await createCustomField.mutateAsync({
        workspaceId,
        name: createForm.name.trim(),
        type: createForm.type,
        options:
          createForm.type === "select"
            ? createForm.options.map((option) => option.trim()).filter(Boolean)
            : undefined,
        isRequired: createForm.isRequired,
      });
      toast.success(
        t("settings:workspaceCustomFields.createSuccess", {
          defaultValue: "Custom field created",
        }),
      );
      setCreateOpen(false);
      resetCreate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceCustomFields.createError", {
              defaultValue: "Failed to create custom field",
            }),
      );
    }
  };

  const openEdit = (field: {
    id: string;
    name: string;
    type: CustomFieldType;
    options: string[] | null;
    isRequired: boolean;
  }) => {
    setEditingFieldId(field.id);
    setEditForm({
      name: field.name,
      type: field.type,
      options: field.options ?? [],
      isRequired: field.isRequired,
    });
    setEditError("");
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingFieldId) return;

    const error = validateForm(editForm);
    if (error) {
      setEditError(error);
      return;
    }

    try {
      await updateCustomField.mutateAsync({
        id: editingFieldId,
        name: editForm.name.trim(),
        options:
          editForm.type === "select"
            ? editForm.options.map((option) => option.trim()).filter(Boolean)
            : undefined,
        isRequired: editForm.isRequired,
      });
      toast.success(
        t("settings:workspaceCustomFields.updateSuccess", {
          defaultValue: "Custom field updated",
        }),
      );
      setEditOpen(false);
      setEditingFieldId(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceCustomFields.updateError", {
              defaultValue: "Failed to update custom field",
            }),
      );
    }
  };

  const openDelete = (field: { id: string; name: string }) => {
    setDeletingField(field);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingField) return;

    try {
      await deleteCustomField.mutateAsync({ id: deletingField.id });
      toast.success(
        t("settings:workspaceCustomFields.deleteSuccess", {
          defaultValue: "Custom field deleted",
        }),
      );
      setDeleteOpen(false);
      setDeletingField(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceCustomFields.deleteError", {
              defaultValue: "Failed to delete custom field",
            }),
      );
    }
  };

  const renderOptionsEditor = (
    form: FieldFormState,
    setForm: (updater: (prev: FieldFormState) => FieldFormState) => void,
  ) => (
    <div className="space-y-2">
      <Label>
        {t("settings:workspaceCustomFields.optionsLabel", {
          defaultValue: "Options",
        })}
      </Label>
      <div className="space-y-2">
        {form.options.map((option, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: options are positionally edited
          <div key={index} className="flex items-center gap-2">
            <Input
              value={option}
              onChange={(e) => {
                const value = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  options: prev.options.map((o, i) =>
                    i === index ? value : o,
                  ),
                }));
              }}
              placeholder={t(
                "settings:workspaceCustomFields.optionPlaceholder",
                {
                  defaultValue: "Enter option",
                },
              )}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  options: prev.options.filter((_, i) => i !== index),
                }))
              }
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            setForm((prev) => ({ ...prev, options: [...prev.options, ""] }))
          }
        >
          <Plus className="size-3.5" />
          {t("settings:workspaceCustomFields.addOption", {
            defaultValue: "Add option",
          })}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <PageTitle title={t("settings:workspaceCustomFields.pageTitle")} />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {t("settings:workspaceCustomFields.title", {
              defaultValue: "Custom Fields",
            })}
          </h1>
          <p className="text-muted-foreground">
            {t("settings:workspaceCustomFields.subtitle", {
              defaultValue:
                "Create, edit, and delete workspace-level custom fields.",
            })}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-md font-medium">
                {t("settings:workspaceCustomFields.title", {
                  defaultValue: "Custom Fields",
                })}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("settings:workspaceCustomFields.cardDescription", {
                  defaultValue:
                    "Manage custom fields that can be set on tasks.",
                })}
              </p>
            </div>
            {canEdit && (
              <Button onClick={openCreate} className="gap-2">
                <Plus className="size-4" />
                {t("settings:workspaceCustomFields.createField", {
                  defaultValue: "Create Field",
                })}
              </Button>
            )}
          </div>

          <div className="border border-border rounded-md bg-sidebar">
            {fields.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <ListChecks className="size-8 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {t("settings:workspaceCustomFields.empty", {
                      defaultValue:
                        "No custom fields yet. Create your first field to get started.",
                    })}
                  </EmptyTitle>
                  <EmptyDescription />
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y divide-border">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between py-2.5 px-1"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm truncate">{field.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {typeLabel(field.type as CustomFieldType)}
                      </Badge>
                      {field.isRequired && (
                        <Badge variant="outline" className="text-[10px]">
                          {t("settings:workspaceCustomFields.required", {
                            defaultValue: "Required",
                          })}
                        </Badge>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t(
                            "settings:workspaceCustomFields.editField",
                            { defaultValue: "Edit Field" },
                          )}
                          className="h-8 w-8"
                          onClick={() =>
                            openEdit({
                              id: field.id,
                              name: field.name,
                              type: field.type as CustomFieldType,
                              options: field.options as string[] | null,
                              isRequired: field.isRequired,
                            })
                          }
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t(
                            "settings:workspaceCustomFields.deleteField",
                            { defaultValue: "Delete" },
                          )}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() =>
                            openDelete({ id: field.id, name: field.name })
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => !open && setCreateOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("settings:workspaceCustomFields.createField", {
                defaultValue: "Create Field",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("settings:workspaceCustomFields.createDescription", {
                defaultValue:
                  "Create a new custom field that can be set on tasks in this workspace.",
              })}
            </DialogDescription>
          </DialogHeader>

          <DialogPanel className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-field-name">
                {t("settings:workspaceCustomFields.nameLabel", {
                  defaultValue: "Field name",
                })}
              </Label>
              <Input
                id="new-field-name"
                value={createForm.name}
                onChange={(e) => {
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }));
                  setCreateError("");
                }}
                placeholder={t(
                  "settings:workspaceCustomFields.namePlaceholder",
                  {
                    defaultValue: "Enter field name",
                  },
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !createCustomField.isPending)
                    handleCreate();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t("settings:workspaceCustomFields.typeLabel", {
                  defaultValue: "Field type",
                })}
              </Label>
              <Select
                value={createForm.type}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    type: value as CustomFieldType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue>{typeLabel(createForm.type)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {createForm.type === "select" &&
              renderOptionsEditor(createForm, setCreateForm)}

            <div className="flex items-center gap-2">
              <Checkbox
                id="new-field-required"
                checked={createForm.isRequired}
                onCheckedChange={(checked) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    isRequired: checked === true,
                  }))
                }
              />
              <Label htmlFor="new-field-required" className="font-normal">
                {t("settings:workspaceCustomFields.requiredLabel", {
                  defaultValue: "Required",
                })}
              </Label>
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </DialogPanel>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common:actions.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createCustomField.isPending}
            >
              {t("settings:workspaceCustomFields.createField", {
                defaultValue: "Create Field",
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false);
            setEditingFieldId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("settings:workspaceCustomFields.editField", {
                defaultValue: "Edit Field",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("settings:workspaceCustomFields.editDescription", {
                defaultValue:
                  "Update this custom field. The field type cannot be changed after creation.",
              })}
            </DialogDescription>
          </DialogHeader>

          <DialogPanel className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-field-name">
                {t("settings:workspaceCustomFields.nameLabel", {
                  defaultValue: "Field name",
                })}
              </Label>
              <Input
                id="edit-field-name"
                value={editForm.name}
                onChange={(e) => {
                  setEditForm((prev) => ({ ...prev, name: e.target.value }));
                  setEditError("");
                }}
                placeholder={t(
                  "settings:workspaceCustomFields.namePlaceholder",
                  {
                    defaultValue: "Enter field name",
                  },
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !updateCustomField.isPending)
                    handleEdit();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t("settings:workspaceCustomFields.typeLabel", {
                  defaultValue: "Field type",
                })}
              </Label>
              <Select value={editForm.type} disabled>
                <SelectTrigger>
                  <SelectValue>{typeLabel(editForm.type)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editForm.type === "select" &&
              renderOptionsEditor(editForm, setEditForm)}

            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-field-required"
                checked={editForm.isRequired}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({
                    ...prev,
                    isRequired: checked === true,
                  }))
                }
              />
              <Label htmlFor="edit-field-required" className="font-normal">
                {t("settings:workspaceCustomFields.requiredLabel", {
                  defaultValue: "Required",
                })}
              </Label>
            </div>

            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </DialogPanel>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditingFieldId(null);
              }}
            >
              {t("common:actions.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button onClick={handleEdit} disabled={updateCustomField.isPending}>
              {t("settings:workspaceCustomFields.saveField", {
                defaultValue: "Save",
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOpen(false);
            setDeletingField(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings:workspaceCustomFields.deleteConfirmTitle", {
                defaultValue: "Delete this custom field?",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings:workspaceCustomFields.deleteConfirmDescription", {
                defaultValue:
                  "This will permanently remove this field and its values from all tasks. This action cannot be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingField(null);
              }}
            >
              {t("common:actions.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCustomField.isPending}
            >
              {t("settings:workspaceCustomFields.deleteField", {
                defaultValue: "Delete",
              })}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
