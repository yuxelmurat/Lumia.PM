import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  LayoutTemplate,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import useCreateProjectTemplate from "@/hooks/mutations/project-template/use-create-project-template";
import useDeleteProjectTemplate from "@/hooks/mutations/project-template/use-delete-project-template";
import useUpdateProjectTemplate from "@/hooks/mutations/project-template/use-update-project-template";
import useGetProjectTemplate from "@/hooks/queries/project-template/use-get-project-template";
import useGetProjectTemplatesByWorkspace from "@/hooks/queries/project-template/use-get-project-templates-by-workspace";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/workspace/project-templates",
)({
  component: RouteComponent,
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type ColumnFormState = {
  key: string;
  name: string;
  slug: string;
  isFinal: boolean;
};

type TaskFormState = {
  key: string;
  title: string;
  description: string;
  columnSlug: string;
};

type TemplateFormState = {
  name: string;
  description: string;
  icon: string;
  columns: ColumnFormState[];
  tasks: TaskFormState[];
};

let keyCounter = 0;
function nextKey() {
  keyCounter += 1;
  return `k${keyCounter}`;
}

function emptyForm(): TemplateFormState {
  return {
    name: "",
    description: "",
    icon: "",
    columns: [],
    tasks: [],
  };
}

function RouteComponent() {
  const { t } = useTranslation();
  const { workspace, canManageProjectTemplates } = useWorkspacePermission();
  const canEdit = canManageProjectTemplates();

  const workspaceId = workspace?.id ?? "";

  const { data: templates = [] } =
    useGetProjectTemplatesByWorkspace(workspaceId);

  const createProjectTemplate = useCreateProjectTemplate();
  const updateProjectTemplate = useUpdateProjectTemplate();
  const deleteProjectTemplate = useDeleteProjectTemplate();

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TemplateFormState>(emptyForm());
  const [createError, setCreateError] = useState("");

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [editForm, setEditForm] = useState<TemplateFormState>(emptyForm());
  const [editError, setEditError] = useState("");
  const { data: editingTemplateDetail } = useGetProjectTemplate(
    editingTemplateId ?? "",
  );

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const resetCreate = () => {
    setCreateForm(emptyForm());
    setCreateError("");
  };

  const openCreate = () => {
    resetCreate();
    setCreateOpen(true);
  };

  const validateForm = (form: TemplateFormState) => {
    if (!form.name.trim()) {
      return t("settings:workspaceProjectTemplates.nameRequired", {
        defaultValue: "Template name is required",
      });
    }
    if (form.columns.length === 0) {
      return t("settings:workspaceProjectTemplates.columnsRequired", {
        defaultValue: "At least one column is required",
      });
    }
    if (form.columns.some((column) => !column.name.trim())) {
      return t("settings:workspaceProjectTemplates.columnNameRequired", {
        defaultValue: "Every column needs a name",
      });
    }
    const slugs = form.columns.map((column) => column.slug);
    if (new Set(slugs).size !== slugs.length) {
      return t("settings:workspaceProjectTemplates.columnSlugsUnique", {
        defaultValue: "Column slugs must be unique",
      });
    }
    if (form.tasks.some((task) => !task.title.trim())) {
      return t("settings:workspaceProjectTemplates.taskTitleRequired", {
        defaultValue: "Every starter task needs a title",
      });
    }
    if (form.tasks.some((task) => !task.columnSlug)) {
      return t("settings:workspaceProjectTemplates.taskColumnRequired", {
        defaultValue: "Every starter task needs a column",
      });
    }
    return "";
  };

  const toColumnsPayload = (form: TemplateFormState) =>
    form.columns.map((column, index) => ({
      name: column.name.trim(),
      slug: column.slug.trim(),
      position: index,
      isFinal: column.isFinal,
    }));

  const toTasksPayload = (form: TemplateFormState) =>
    form.tasks.map((task, index) => ({
      title: task.title.trim(),
      description: task.description.trim() || undefined,
      columnSlug: task.columnSlug,
      position: index,
    }));

  const addColumn = (
    setForm: (updater: (prev: TemplateFormState) => TemplateFormState) => void,
  ) =>
    setForm((prev) => ({
      ...prev,
      columns: [
        ...prev.columns,
        { key: nextKey(), name: "", slug: "", isFinal: false },
      ],
    }));

  const removeColumn = (
    setForm: (updater: (prev: TemplateFormState) => TemplateFormState) => void,
    key: string,
  ) =>
    setForm((prev) => {
      const removedColumn = prev.columns.find((column) => column.key === key);
      return {
        ...prev,
        columns: prev.columns.filter((column) => column.key !== key),
        // Starter tasks pointed at a removed column no longer have a valid target.
        tasks: prev.tasks.map((task) =>
          removedColumn && task.columnSlug === removedColumn.slug
            ? { ...task, columnSlug: "" }
            : task,
        ),
      };
    });

  const moveColumn = (
    setForm: (updater: (prev: TemplateFormState) => TemplateFormState) => void,
    key: string,
    direction: -1 | 1,
  ) =>
    setForm((prev) => {
      const index = prev.columns.findIndex((column) => column.key === key);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.columns.length)
        return prev;
      const columns = [...prev.columns];
      const [removed] = columns.splice(index, 1);
      columns.splice(targetIndex, 0, removed);
      return { ...prev, columns };
    });

  const updateColumn = (
    setForm: (updater: (prev: TemplateFormState) => TemplateFormState) => void,
    key: string,
    patch: Partial<ColumnFormState>,
  ) =>
    setForm((prev) => {
      const previousColumn = prev.columns.find((column) => column.key === key);
      const nextColumns = prev.columns.map((column) =>
        column.key === key ? { ...column, ...patch } : column,
      );
      // Keep starter tasks in sync when a column's slug changes.
      if (
        previousColumn &&
        patch.slug !== undefined &&
        patch.slug !== previousColumn.slug
      ) {
        return {
          ...prev,
          columns: nextColumns,
          tasks: prev.tasks.map((task) =>
            task.columnSlug === previousColumn.slug
              ? { ...task, columnSlug: patch.slug ?? "" }
              : task,
          ),
        };
      }
      return { ...prev, columns: nextColumns };
    });

  const addTask = (
    setForm: (updater: (prev: TemplateFormState) => TemplateFormState) => void,
    defaultColumnSlug: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          key: nextKey(),
          title: "",
          description: "",
          columnSlug: defaultColumnSlug,
        },
      ],
    }));

  const removeTask = (
    setForm: (updater: (prev: TemplateFormState) => TemplateFormState) => void,
    key: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.key !== key),
    }));

  const updateTask = (
    setForm: (updater: (prev: TemplateFormState) => TemplateFormState) => void,
    key: string,
    patch: Partial<TaskFormState>,
  ) =>
    setForm((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.key === key ? { ...task, ...patch } : task,
      ),
    }));

  const handleCreate = async () => {
    const error = validateForm(createForm);
    if (error) {
      setCreateError(error);
      return;
    }

    try {
      await createProjectTemplate.mutateAsync({
        workspaceId,
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        icon: createForm.icon.trim() || undefined,
        columns: toColumnsPayload(createForm),
        tasks: toTasksPayload(createForm),
      });
      toast.success(
        t("settings:workspaceProjectTemplates.createSuccess", {
          defaultValue: "Project template created",
        }),
      );
      setCreateOpen(false);
      resetCreate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceProjectTemplates.createError", {
              defaultValue: "Failed to create project template",
            }),
      );
    }
  };

  const openEdit = (templateId: string) => {
    setEditingTemplateId(templateId);
    setEditForm(emptyForm());
    setEditError("");
    setEditOpen(true);
  };

  // Populate the edit form once the template detail (columns + tasks) loads.
  useEffect(() => {
    if (
      !editOpen ||
      !editingTemplateId ||
      !editingTemplateDetail ||
      editingTemplateDetail.id !== editingTemplateId
    ) {
      return;
    }
    const sortedColumns = [...editingTemplateDetail.columns].sort(
      (a, b) => a.position - b.position,
    );
    const sortedTasks = [...editingTemplateDetail.tasks].sort(
      (a, b) => a.position - b.position,
    );
    setEditForm({
      name: editingTemplateDetail.name,
      description: editingTemplateDetail.description ?? "",
      icon: editingTemplateDetail.icon ?? "",
      columns: sortedColumns.map((column) => ({
        key: nextKey(),
        name: column.name,
        slug: column.slug,
        isFinal: column.isFinal,
      })),
      tasks: sortedTasks.map((task) => ({
        key: nextKey(),
        title: task.title,
        description: task.description ?? "",
        columnSlug: task.columnSlug,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen, editingTemplateId, editingTemplateDetail]);

  const handleEdit = async () => {
    if (!editingTemplateId) return;

    const error = validateForm(editForm);
    if (error) {
      setEditError(error);
      return;
    }

    try {
      await updateProjectTemplate.mutateAsync({
        id: editingTemplateId,
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        icon: editForm.icon.trim() || null,
        columns: toColumnsPayload(editForm),
        tasks: toTasksPayload(editForm),
      });
      toast.success(
        t("settings:workspaceProjectTemplates.updateSuccess", {
          defaultValue: "Project template updated",
        }),
      );
      setEditOpen(false);
      setEditingTemplateId(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceProjectTemplates.updateError", {
              defaultValue: "Failed to update project template",
            }),
      );
    }
  };

  const openDelete = (template: { id: string; name: string }) => {
    setDeletingTemplate(template);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      await deleteProjectTemplate.mutateAsync({ id: deletingTemplate.id });
      toast.success(
        t("settings:workspaceProjectTemplates.deleteSuccess", {
          defaultValue: "Project template deleted",
        }),
      );
      setDeleteOpen(false);
      setDeletingTemplate(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceProjectTemplates.deleteError", {
              defaultValue: "Failed to delete project template",
            }),
      );
    }
  };

  const renderColumnsEditor = (
    form: TemplateFormState,
    setForm: (updater: (prev: TemplateFormState) => TemplateFormState) => void,
  ) => (
    <div className="space-y-2">
      <Label>
        {t("settings:workspaceProjectTemplates.columnsLabel", {
          defaultValue: "Columns",
        })}
      </Label>
      <div className="space-y-2">
        {form.columns.map((column, index) => (
          <div
            key={column.key}
            className="flex items-center gap-2 p-2 border border-border rounded-md"
          >
            <div className="flex flex-col gap-0.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                disabled={index === 0}
                onClick={() => moveColumn(setForm, column.key, -1)}
              >
                <ArrowUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                disabled={index === form.columns.length - 1}
                onClick={() => moveColumn(setForm, column.key, 1)}
              >
                <ArrowDown className="size-3" />
              </Button>
            </div>
            <Input
              value={column.name}
              onChange={(e) => {
                const name = e.target.value;
                updateColumn(setForm, column.key, {
                  name,
                  slug: slugify(name),
                });
              }}
              placeholder={t(
                "settings:workspaceProjectTemplates.columnNamePlaceholder",
                { defaultValue: "Column name" },
              )}
              className="h-8 text-sm flex-1"
            />
            <Input
              value={column.slug}
              onChange={(e) =>
                updateColumn(setForm, column.key, { slug: e.target.value })
              }
              placeholder={t(
                "settings:workspaceProjectTemplates.columnSlugPlaceholder",
                { defaultValue: "slug" },
              )}
              className="h-8 text-sm w-28"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Checkbox
                id={`column-final-${column.key}`}
                checked={column.isFinal}
                onCheckedChange={(checked) =>
                  updateColumn(setForm, column.key, {
                    isFinal: checked === true,
                  })
                }
              />
              <Label
                htmlFor={`column-final-${column.key}`}
                className="font-normal text-xs whitespace-nowrap"
              >
                {t("settings:workspaceProjectTemplates.doneColumn", {
                  defaultValue: "Done",
                })}
              </Label>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => removeColumn(setForm, column.key)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => addColumn(setForm)}
        >
          <Plus className="size-3.5" />
          {t("settings:workspaceProjectTemplates.addColumn", {
            defaultValue: "Add column",
          })}
        </Button>
      </div>
    </div>
  );

  const renderTasksEditor = (
    form: TemplateFormState,
    setForm: (updater: (prev: TemplateFormState) => TemplateFormState) => void,
  ) => (
    <div className="space-y-2">
      <Label>
        {t("settings:workspaceProjectTemplates.tasksLabel", {
          defaultValue: "Starter tasks (optional)",
        })}
      </Label>
      <div className="space-y-2">
        {form.tasks.map((task) => (
          <div
            key={task.key}
            className="space-y-2 p-2 border border-border rounded-md"
          >
            <div className="flex items-center gap-2">
              <Input
                value={task.title}
                onChange={(e) =>
                  updateTask(setForm, task.key, { title: e.target.value })
                }
                placeholder={t(
                  "settings:workspaceProjectTemplates.taskTitlePlaceholder",
                  { defaultValue: "Task title" },
                )}
                className="h-8 text-sm flex-1"
              />
              <Select
                value={task.columnSlug}
                onValueChange={(value) =>
                  updateTask(setForm, task.key, { columnSlug: value ?? "" })
                }
                disabled={form.columns.length === 0}
              >
                <SelectTrigger className="h-8 w-40 text-sm">
                  <SelectValue
                    placeholder={t(
                      "settings:workspaceProjectTemplates.taskColumnPlaceholder",
                      { defaultValue: "Column" },
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {form.columns.map((column) => (
                    <SelectItem
                      key={column.key}
                      value={column.slug}
                      disabled={!column.slug}
                    >
                      {column.name || column.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => removeTask(setForm, task.key)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
            <Input
              value={task.description}
              onChange={(e) =>
                updateTask(setForm, task.key, { description: e.target.value })
              }
              placeholder={t(
                "settings:workspaceProjectTemplates.taskDescriptionPlaceholder",
                { defaultValue: "Description (optional)" },
              )}
              className="h-8 text-sm"
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={form.columns.length === 0}
          onClick={() => addTask(setForm, form.columns[0]?.slug ?? "")}
        >
          <Plus className="size-3.5" />
          {t("settings:workspaceProjectTemplates.addTask", {
            defaultValue: "Add starter task",
          })}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <PageTitle
        title={t("settings:workspaceProjectTemplates.pageTitle", {
          defaultValue: "Project Template Settings",
        })}
      />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {t("settings:workspaceProjectTemplates.title", {
              defaultValue: "Project Templates",
            })}
          </h1>
          <p className="text-muted-foreground">
            {t("settings:workspaceProjectTemplates.subtitle", {
              defaultValue:
                "Create reusable project templates that anyone can start a new project from.",
            })}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-md font-medium">
                {t("settings:workspaceProjectTemplates.title", {
                  defaultValue: "Project Templates",
                })}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("settings:workspaceProjectTemplates.cardDescription", {
                  defaultValue:
                    "Manage the templates available when creating a new project.",
                })}
              </p>
            </div>
            {canEdit && (
              <Button onClick={openCreate} className="gap-2">
                <Plus className="size-4" />
                {t("settings:workspaceProjectTemplates.createTemplate", {
                  defaultValue: "Create Template",
                })}
              </Button>
            )}
          </div>

          <div className="border border-border rounded-md bg-sidebar">
            {templates.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <LayoutTemplate className="size-8 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {t("settings:workspaceProjectTemplates.empty", {
                      defaultValue:
                        "No project templates yet. Create your first template to get started.",
                    })}
                  </EmptyTitle>
                  <EmptyDescription />
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y divide-border">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between py-2.5 px-1 gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm truncate">{template.name}</span>
                      {template.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[240px]">
                          {template.description}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {t("settings:workspaceProjectTemplates.columnCount", {
                          defaultValue: "{{count}} columns",
                          count: template.columnCount,
                        })}
                      </Badge>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t(
                            "settings:workspaceProjectTemplates.editTemplate",
                            { defaultValue: "Edit Template" },
                          )}
                          className="h-8 w-8"
                          onClick={() => openEdit(template.id)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t(
                            "settings:workspaceProjectTemplates.deleteTemplate",
                            { defaultValue: "Delete" },
                          )}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() =>
                            openDelete({
                              id: template.id,
                              name: template.name,
                            })
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t("settings:workspaceProjectTemplates.createTemplate", {
                defaultValue: "Create Template",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("settings:workspaceProjectTemplates.createDescription", {
                defaultValue:
                  "Define the columns and optional starter tasks that new projects built from this template will start with.",
              })}
            </DialogDescription>
          </DialogHeader>

          <DialogPanel className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-template-name">
                {t("settings:workspaceProjectTemplates.nameLabel", {
                  defaultValue: "Template name",
                })}
              </Label>
              <Input
                id="new-template-name"
                value={createForm.name}
                onChange={(e) => {
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }));
                  setCreateError("");
                }}
                placeholder={t(
                  "settings:workspaceProjectTemplates.namePlaceholder",
                  { defaultValue: "Enter template name" },
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-template-description">
                {t("settings:workspaceProjectTemplates.descriptionLabel", {
                  defaultValue: "Description",
                })}
              </Label>
              <Textarea
                id="new-template-description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t(
                  "settings:workspaceProjectTemplates.descriptionPlaceholder",
                  { defaultValue: "What is this template for?" },
                )}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-template-icon">
                {t("settings:workspaceProjectTemplates.iconLabel", {
                  defaultValue: "Icon",
                })}
              </Label>
              <Input
                id="new-template-icon"
                value={createForm.icon}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, icon: e.target.value }))
                }
                placeholder={t(
                  "settings:workspaceProjectTemplates.iconPlaceholder",
                  { defaultValue: "Icon name (optional)" },
                )}
              />
            </div>

            {renderColumnsEditor(createForm, setCreateForm)}
            {renderTasksEditor(createForm, setCreateForm)}

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
              disabled={createProjectTemplate.isPending}
            >
              {t("settings:workspaceProjectTemplates.createTemplate", {
                defaultValue: "Create Template",
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
            setEditingTemplateId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t("settings:workspaceProjectTemplates.editTemplate", {
                defaultValue: "Edit Template",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("settings:workspaceProjectTemplates.editDescription", {
                defaultValue:
                  "Update this template's details, columns, and starter tasks.",
              })}
            </DialogDescription>
          </DialogHeader>

          <DialogPanel className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-template-name">
                {t("settings:workspaceProjectTemplates.nameLabel", {
                  defaultValue: "Template name",
                })}
              </Label>
              <Input
                id="edit-template-name"
                value={editForm.name}
                onChange={(e) => {
                  setEditForm((prev) => ({ ...prev, name: e.target.value }));
                  setEditError("");
                }}
                placeholder={t(
                  "settings:workspaceProjectTemplates.namePlaceholder",
                  { defaultValue: "Enter template name" },
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-template-description">
                {t("settings:workspaceProjectTemplates.descriptionLabel", {
                  defaultValue: "Description",
                })}
              </Label>
              <Textarea
                id="edit-template-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t(
                  "settings:workspaceProjectTemplates.descriptionPlaceholder",
                  { defaultValue: "What is this template for?" },
                )}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-template-icon">
                {t("settings:workspaceProjectTemplates.iconLabel", {
                  defaultValue: "Icon",
                })}
              </Label>
              <Input
                id="edit-template-icon"
                value={editForm.icon}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, icon: e.target.value }))
                }
                placeholder={t(
                  "settings:workspaceProjectTemplates.iconPlaceholder",
                  { defaultValue: "Icon name (optional)" },
                )}
              />
            </div>

            {renderColumnsEditor(editForm, setEditForm)}
            {renderTasksEditor(editForm, setEditForm)}

            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </DialogPanel>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditingTemplateId(null);
              }}
            >
              {t("common:actions.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateProjectTemplate.isPending}
            >
              {t("settings:workspaceProjectTemplates.saveTemplate", {
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
            setDeletingTemplate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings:workspaceProjectTemplates.deleteConfirmTitle", {
                defaultValue: "Delete this project template?",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "settings:workspaceProjectTemplates.deleteConfirmDescription",
                {
                  defaultValue:
                    "This will permanently remove this template and its columns and starter tasks. Projects already created from it are not affected. This action cannot be undone.",
                },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingTemplate(null);
              }}
            >
              {t("common:actions.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProjectTemplate.isPending}
            >
              {t("settings:workspaceProjectTemplates.deleteTemplate", {
                defaultValue: "Delete",
              })}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
