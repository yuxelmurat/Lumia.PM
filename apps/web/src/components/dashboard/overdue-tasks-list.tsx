import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";

type OverdueTask = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  dueDate: string;
  assigneeName: string | null;
};

export function OverdueTasksList({
  workspaceId,
  tasks,
  isLoading,
}: {
  workspaceId: string;
  tasks: OverdueTask[] | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard:overdueTasks.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="flex flex-col divide-y">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="flex items-center justify-between gap-2 py-2 text-left hover:bg-muted/50"
                onClick={() =>
                  navigate({
                    to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
                    params: {
                      workspaceId,
                      projectId: task.projectId,
                      taskId: task.id,
                    },
                  })
                }
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {task.title}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {task.projectName}
                    {task.assigneeName ? ` · ${task.assigneeName}` : ""}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-destructive">
                  {formatRelativeTime(task.dueDate)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>{t("dashboard:overdueTasks.emptyTitle")}</EmptyTitle>
              <EmptyDescription>
                {t("dashboard:overdueTasks.emptyDescription")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
