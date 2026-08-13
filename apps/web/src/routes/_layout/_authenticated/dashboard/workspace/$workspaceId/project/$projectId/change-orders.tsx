import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import ChangeOrderList from "@/components/change-order/change-order-list";
import ProjectLayout from "@/components/common/project-layout";
import PageTitle from "@/components/page-title";
import useGetProject from "@/hooks/queries/project/use-get-project";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/change-orders",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { projectId, workspaceId } = Route.useParams();
  const { data: project } = useGetProject({ id: projectId, workspaceId });

  return (
    <ProjectLayout
      projectId={projectId}
      workspaceId={workspaceId}
      activeView="changeOrders"
    >
      <PageTitle
        title={t("changeOrder:pageTitle", { name: project?.name })}
        hideAppName
      />
      <ChangeOrderList projectId={projectId} />
    </ProjectLayout>
  );
}
