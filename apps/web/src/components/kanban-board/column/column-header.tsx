import { produce } from "immer";
import { Archive, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import CreateTaskModal from "@/components/shared/modals/create-task-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateColumn } from "@/hooks/mutations/column/use-update-column";
import { useUpdateTask } from "@/hooks/mutations/task/use-update-task";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { cn } from "@/lib/cn";
import { getColumnIcon } from "@/lib/column";
import { toast } from "@/lib/toast";
import useProjectStore from "@/store/project";
import type { ProjectWithTasks } from "@/types/project";
import { ArchiveTasksModal } from "../../shared/modals/archive-tasks-modal";

function ColumnBudgetBadge({
  column,
  projectId,
  canEdit,
}: {
  column: ProjectWithTasks["columns"][number];
  projectId: string;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const { mutateAsync: updateColumn, isPending } = useUpdateColumn();
  const [open, setOpen] = useState(false);
  const [draftHours, setDraftHours] = useState("");

  const consumedHours = Math.round((column.consumedSeconds / 3600) * 10) / 10;
  const isOverBudget =
    column.budgetHours != null && consumedHours > column.budgetHours;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setDraftHours(column.budgetHours?.toString() ?? "");
  };

  const handleSave = async () => {
    const trimmed = draftHours.trim();
    try {
      await updateColumn({
        id: column.columnId,
        projectId,
        data: { budgetHours: trimmed ? Number.parseInt(trimmed, 10) : null },
      });
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("tasks:column.budget.updateFailed", "Failed to update budget"),
      );
    }
  };

  if (!canEdit && column.budgetHours == null) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={!canEdit}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-xs font-medium",
            column.budgetHours == null
              ? "text-muted-foreground hover:bg-accent/50"
              : isOverBudget
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground",
          )}
        >
          {column.budgetHours != null
            ? t("tasks:column.budget.usage", {
                consumed: consumedHours,
                budget: column.budgetHours,
              })
            : canEdit
              ? t("tasks:column.budget.setBudget", "Set budget")
              : null}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t("tasks:column.budget.hoursLabel", "Budget (hours)")}
          </span>
          <Input
            type="number"
            min="0"
            value={draftHours}
            onChange={(event) => setDraftHours(event.target.value)}
            placeholder={t("tasks:column.budget.placeholder", "No limit")}
            className="h-8 text-xs"
          />
          <Button
            size="xs"
            className="w-full"
            disabled={isPending}
            onClick={handleSave}
          >
            {t("common:actions.save", "Save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

type ColumnHeaderProps = {
  column: ProjectWithTasks["columns"][number];
};

export function ColumnHeader({ column }: ColumnHeaderProps) {
  const { t } = useTranslation();
  const { project, setProject } = useProjectStore();
  const { mutate: updateTask } = useUpdateTask();
  const { canManageTasks, canCreateTasks, canUpdateProjects } =
    useWorkspacePermission();
  const canTask = canManageTasks();
  const canCreate = canCreateTasks();
  const canEditBudget = canUpdateProjects();

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleConfirmArchive = () => {
    if (!column.isFinal || !project) return;

    const updatedProject = produce(project, (draft) => {
      const archivedColumn = draft?.columns?.find(
        (col) => col.id === column.id,
      );
      if (!archivedColumn) return;

      for (const task of archivedColumn.tasks) {
        updateTask({
          ...task,
          status: "archived",
        });
      }

      archivedColumn.tasks = [];
    });

    setProject(updatedProject);
    toast.success(t("tasks:archive.success", { count: column.tasks.length }));
    setIsArchiveModalOpen(false);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-muted-foreground">
          {getColumnIcon(column.id, column.isFinal, column.icon)}
        </span>
        <span className="truncate text-sm font-medium text-foreground/95">
          {column.name}
        </span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          {column.tasks.length}
        </span>
        {project && (
          <ColumnBudgetBadge
            column={column}
            projectId={project.id}
            canEdit={canEditBudget}
          />
        )}
      </div>

      <div className="flex items-center">
        {canTask && column.isFinal && column.tasks.length > 0 && (
          <button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            className="flex items-center rounded-md px-2 py-1 text-left text-muted-foreground transition-colors hover:bg-accent/50"
            title={t("tasks:listView.archiveAllTooltip")}
          >
            <Archive className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        {canCreate && (
          <button
            type="button"
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center rounded-md px-2 py-1 text-left text-muted-foreground transition-colors hover:bg-accent/50"
            title={t("tasks:kanban.addTask")}
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <CreateTaskModal
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        projectId={project?.id}
        status={column.id}
      />

      <ArchiveTasksModal
        open={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleConfirmArchive}
        taskCount={column.tasks.length}
      />
    </div>
  );
}
