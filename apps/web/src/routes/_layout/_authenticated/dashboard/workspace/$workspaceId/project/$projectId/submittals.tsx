import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import ProjectLayout from "@/components/common/project-layout";
import PageTitle from "@/components/page-title";
import SubmittalList from "@/components/submittal/submittal-list";
import useGetProject from "@/hooks/queries/project/use-get-project";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/submittals",
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
      activeView="submittals"
    >
      <PageTitle
        title={t("submittal:pageTitle", { name: project?.name })}
        hideAppName
      />
      <SubmittalList projectId={projectId} workspaceId={workspaceId} />
    </ProjectLayout>
  );
}
