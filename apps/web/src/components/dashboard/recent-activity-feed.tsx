import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";

type ActivityItem = {
  id: string;
  type: string;
  content: string | null;
  createdAt: string;
  userName: string | null;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
};

export function RecentActivityFeed({
  workspaceId,
  items,
  isLoading,
}: {
  workspaceId: string;
  items: ActivityItem[] | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard:recentActivity.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="flex flex-col divide-y">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex items-center justify-between gap-2 py-2 text-left hover:bg-muted/50"
                onClick={() =>
                  navigate({
                    to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
                    params: {
                      workspaceId,
                      projectId: item.projectId,
                      taskId: item.taskId,
                    },
                  })
                }
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    <span className="font-medium">
                      {item.userName ??
                        t("dashboard:recentActivity.unknownUser")}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {item.content ?? item.type}
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {item.taskTitle} · {item.projectName}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(item.createdAt)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("dashboard:recentActivity.empty")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
