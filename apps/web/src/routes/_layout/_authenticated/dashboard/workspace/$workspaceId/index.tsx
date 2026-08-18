import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { OverdueTasksList } from "@/components/dashboard/overdue-tasks-list";
import { ProjectProgressCards } from "@/components/dashboard/project-progress-cards";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { StatusSummary } from "@/components/dashboard/status-summary";
import PageTitle from "@/components/page-title";
import { useDashboardSummary } from "@/hooks/queries/dashboard/use-dashboard-summary";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();
  const { data, isLoading } = useDashboardSummary(workspaceId);

  return (
    <>
      <PageTitle title={t("dashboard:pageTitle")} />
      <WorkspaceLayout title={t("dashboard:pageTitle")}>
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <StatusSummary
            statusCounts={data?.statusCounts}
            isLoading={isLoading}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OverdueTasksList
              workspaceId={workspaceId}
              tasks={data?.overdueTasks}
              isLoading={isLoading}
            />
            <RecentActivityFeed
              workspaceId={workspaceId}
              items={data?.recentActivity}
              isLoading={isLoading}
            />
          </div>
          <ProjectProgressCards workspaceId={workspaceId} />
        </div>
      </WorkspaceLayout>
    </>
  );
}
