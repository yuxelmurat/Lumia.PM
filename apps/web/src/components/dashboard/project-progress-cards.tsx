import { useNavigate } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import icons from "@/constants/project-icons";
import useGetProjects from "@/hooks/queries/project/use-get-projects";

export function ProjectProgressCards({ workspaceId }: { workspaceId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useGetProjects({ workspaceId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard:projectProgress.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {projects.map((project) => {
              const IconComponent =
                icons[project.icon as keyof typeof icons] || icons.Layout;
              return (
                <button
                  key={project.id}
                  type="button"
                  className="flex flex-col gap-2 rounded-lg border p-3 text-left hover:bg-muted/50"
                  onClick={() =>
                    navigate({
                      to: "/dashboard/workspace/$workspaceId/project/$projectId/board",
                      params: { workspaceId, projectId: project.id },
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate text-sm font-medium">
                      {project.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={project.statistics.completionPercentage}
                      className="h-2 flex-1"
                    />
                    <span className="text-xs text-muted-foreground">
                      {project.statistics.completionPercentage}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("dashboard:projectProgress.taskCount", {
                      count: project.statistics.totalTasks,
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderKanban />
              </EmptyMedia>
              <EmptyTitle>
                {t("dashboard:projectProgress.emptyTitle")}
              </EmptyTitle>
              <EmptyDescription>
                {t("dashboard:projectProgress.emptyDescription")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() =>
                  navigate({
                    to: "/dashboard/workspace/$workspaceId/projects",
                    params: { workspaceId },
                  })
                }
              >
                {t("dashboard:projectProgress.emptyAction")}
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
