import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import WorkspaceLayout from "@/components/common/workspace-layout";
import PageTitle from "@/components/page-title";
import WorkloadView from "@/components/workload/workload-view";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/workload",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();

  return (
    <>
      <PageTitle title={t("workload:pageTitle", "Workload")} />
      <WorkspaceLayout title={t("workload:pageTitle", "Workload")}>
        <WorkloadView workspaceId={workspaceId} />
      </WorkspaceLayout>
    </>
  );
}
