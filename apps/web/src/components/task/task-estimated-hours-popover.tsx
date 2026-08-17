import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateTaskEstimatedHours } from "@/hooks/mutations/task/use-update-task-estimated-hours";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";
import type Task from "@/types/task";

type TaskEstimatedHoursPopoverProps = {
  task: Task;
  children: React.ReactNode;
};

export default function TaskEstimatedHoursPopover({
  task,
  children,
}: TaskEstimatedHoursPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(task.estimatedHours?.toString() ?? "");
  const { mutateAsync: updateEstimatedHours, isPending } =
    useUpdateTaskEstimatedHours();
  const { canManageTasks } = useWorkspacePermission();
  const canEdit = canManageTasks();

  if (!canEdit) return <>{children}</>;

  const handleSave = async () => {
    const parsed = value.trim() === "" ? null : Number(value);
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) return;

    try {
      await updateEstimatedHours({ task, estimatedHours: parsed });
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "workload:estimatedHoursFailed",
              "Failed to update estimated hours",
            ),
      );
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(task.estimatedHours?.toString() ?? "");
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t("workload:estimatedHoursPlaceholder", "e.g. 8")}
            className="h-8"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {t("workload:save", "Save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
