import { CheckCircle2, MessageCircleWarning } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useResetTaskApproval } from "@/hooks/mutations/task/use-reset-task-approval";
import useGetTask from "@/hooks/queries/task/use-get-task";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";

type TaskApprovalSectionProps = {
  taskId: string;
};

export default function TaskApprovalSection({
  taskId,
}: TaskApprovalSectionProps) {
  const { t } = useTranslation();
  const { data: task } = useGetTask(taskId);
  const { canManageTasks } = useWorkspacePermission();
  const canReset = canManageTasks();

  const resetApproval = useResetTaskApproval();

  if (!task) return null;

  const handleReset = async () => {
    try {
      await resetApproval.mutateAsync(taskId);
      toast.success(t("tasks:approval.resetSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("tasks:approval.resetError"),
      );
    }
  };

  return (
    <div className="hidden lg:flex px-3 flex-col gap-2 p-2">
      <span className="text-xs font-medium text-foreground/70 px-2">
        {t("tasks:approval.title")}
      </span>

      <div className="flex flex-col gap-3 px-2">
        {task.approvals && task.approvals.length > 0 ? (
          <>
            {task.approvals
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.respondedAt).getTime() -
                  new Date(b.respondedAt).getTime(),
              )
              .map((approval) => (
                <div key={approval.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        approval.status === "approved" ? "success" : "warning"
                      }
                      className="gap-1 px-2 py-0.5 text-[10px] font-medium"
                    >
                      {approval.status === "approved" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <MessageCircleWarning className="w-3 h-3" />
                      )}
                      {approval.status === "approved"
                        ? t("tasks:approval.statusApproved")
                        : t("tasks:approval.statusChangesRequested")}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("tasks:approval.respondedBy", {
                      name: approval.clientName,
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("tasks:approval.respondedAt", {
                      date: formatDateTime(approval.respondedAt),
                    })}
                  </span>
                  {approval.note && (
                    <p className="text-xs text-foreground whitespace-pre-wrap">
                      {approval.note}
                    </p>
                  )}
                </div>
              ))}
            {canReset && (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={handleReset}
                disabled={resetApproval.isPending}
              >
                {t("tasks:approval.reset")}
              </Button>
            )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            {t("tasks:approval.noResponse")}
          </span>
        )}
      </div>
    </div>
  );
}
