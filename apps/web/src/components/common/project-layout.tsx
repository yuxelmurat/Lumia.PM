import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  CalendarDays,
  FileCheck2,
  FileWarning,
  MessageCircleQuestion,
  Package,
  SquareKanban,
  SquircleDashed,
  Stamp,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import MobileProjectNav from "@/components/common/header/mobile-project-nav";
import ProjectCrumbSelect from "@/components/common/header/project-crumb-select";
import WorkspaceCrumbSelect from "@/components/common/header/workspace-crumb-select";
import Layout from "@/components/common/layout";
import CreateProjectModal from "@/components/shared/modals/create-project-modal";
import { Button } from "@/components/ui/button";
import { KbdSequence } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { shortcuts } from "@/constants/shortcuts";
import useGetProject from "@/hooks/queries/project/use-get-project";
import { useProjectWebSocket } from "@/hooks/use-project-websocket";
import { cn } from "@/lib/cn";

type ProjectLayoutProps = {
  projectId: string;
  workspaceId: string;
  headerActions?: ReactNode;
  children: ReactNode;
  showViewSwitcher?: boolean;
  activeView?:
    | "backlog"
    | "board"
    | "gantt"
    | "calendar"
    | "materials"
    | "rfis"
    | "changeOrders"
    | "submittals"
    | "permits";
};

export default function ProjectLayout({
  projectId,
  workspaceId,
  headerActions,
  children,
  showViewSwitcher = true,
  activeView,
}: ProjectLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: project } = useGetProject({ id: projectId, workspaceId });
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);

  useProjectWebSocket(projectId);

  const resolvedView =
    activeView ??
    (location.pathname.includes("/backlog")
      ? "backlog"
      : location.pathname.includes("/gantt")
        ? "gantt"
        : location.pathname.includes("/calendar")
          ? "calendar"
          : location.pathname.includes("/materials")
            ? "materials"
            : location.pathname.includes("/rfis")
              ? "rfis"
              : location.pathname.includes("/change-orders")
                ? "changeOrders"
                : location.pathname.includes("/submittals")
                  ? "submittals"
                  : location.pathname.includes("/permits")
                    ? "permits"
                    : "board");

  const handleNavigateToBacklog = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/backlog",
      params: { workspaceId, projectId },
    });
  };

  const handleNavigateToBoard = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/board",
      params: { workspaceId, projectId },
    });
  };

  const handleNavigateToGantt = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/gantt",
      params: { workspaceId, projectId },
    });
  };

  const handleNavigateToCalendar = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/calendar",
      params: { workspaceId, projectId },
    });
  };

  const handleNavigateToMaterials = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/materials",
      params: { workspaceId, projectId },
    });
  };

  const handleNavigateToRfis = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/rfis",
      params: { workspaceId, projectId },
    });
  };

  const handleNavigateToChangeOrders = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/change-orders",
      params: { workspaceId, projectId },
    });
  };

  const handleNavigateToSubmittals = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/submittals",
      params: { workspaceId, projectId },
    });
  };

  const handleNavigateToPermits = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/permits",
      params: { workspaceId, projectId },
    });
  };

  const handleProjectSwitch = (nextProjectId: string) => {
    navigate({
      to:
        resolvedView === "backlog"
          ? "/dashboard/workspace/$workspaceId/project/$projectId/backlog"
          : resolvedView === "gantt"
            ? "/dashboard/workspace/$workspaceId/project/$projectId/gantt"
            : resolvedView === "calendar"
              ? "/dashboard/workspace/$workspaceId/project/$projectId/calendar"
              : resolvedView === "materials"
                ? "/dashboard/workspace/$workspaceId/project/$projectId/materials"
                : resolvedView === "rfis"
                  ? "/dashboard/workspace/$workspaceId/project/$projectId/rfis"
                  : resolvedView === "changeOrders"
                    ? "/dashboard/workspace/$workspaceId/project/$projectId/change-orders"
                    : resolvedView === "submittals"
                      ? "/dashboard/workspace/$workspaceId/project/$projectId/submittals"
                      : resolvedView === "permits"
                        ? "/dashboard/workspace/$workspaceId/project/$projectId/permits"
                        : "/dashboard/workspace/$workspaceId/project/$projectId/board",
      params: {
        workspaceId,
        projectId: nextProjectId,
      },
    });
  };

  return (
    <Layout>
      <Layout.Header className="h-11 border-border/80 px-2">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="-ml-1 h-7 w-7 cursor-pointer text-foreground/85 hover:text-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="flex items-center gap-2 text-[10px]">
                    Toggle sidebar
                    <KbdSequence
                      keys={[
                        shortcuts.sidebar.prefix,
                        shortcuts.sidebar.toggle,
                      ]}
                    />
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="h-4 w-px shrink-0 bg-border/80" />

            <div className="hidden min-w-0 items-center gap-1 md:flex">
              <WorkspaceCrumbSelect />
              <span className="text-foreground/30 text-xs">/</span>
              <ProjectCrumbSelect
                workspaceId={workspaceId}
                projectId={projectId}
                projectName={project?.name}
                onSelectProject={handleProjectSwitch}
                onAddProject={() => setIsCreateProjectModalOpen(true)}
              />
            </div>

            <div className="md:hidden">
              <MobileProjectNav
                workspaceId={workspaceId}
                projectId={projectId}
                activeView={resolvedView}
                onSelectBacklog={handleNavigateToBacklog}
                onSelectBoard={handleNavigateToBoard}
                onSelectGantt={handleNavigateToGantt}
                onSelectCalendar={handleNavigateToCalendar}
                onSelectMaterials={handleNavigateToMaterials}
                onSelectRfis={handleNavigateToRfis}
                onSelectChangeOrders={handleNavigateToChangeOrders}
                onSelectSubmittals={handleNavigateToSubmittals}
                onSelectPermits={handleNavigateToPermits}
                onSelectProject={handleProjectSwitch}
                onAddProject={() => setIsCreateProjectModalOpen(true)}
              />
            </div>

            {showViewSwitcher && (
              <div className="hidden h-8 items-center gap-0.5 rounded-lg border border-border/80 bg-background p-0.5 sm:inline-flex">
                <Button
                  variant={resolvedView === "backlog" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={handleNavigateToBacklog}
                  className={cn(
                    "h-6 gap-1.5 rounded-md px-2 text-xs",
                    resolvedView !== "backlog" && "text-muted-foreground",
                  )}
                >
                  <SquircleDashed className="size-3.5" />
                  Backlog
                </Button>
                <Button
                  variant={resolvedView === "board" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={handleNavigateToBoard}
                  className={cn(
                    "h-6 gap-1.5 rounded-md px-2 text-xs",
                    resolvedView !== "board" && "text-muted-foreground",
                  )}
                >
                  <SquareKanban className="size-3.5" />
                  Tasks
                </Button>
                <Button
                  variant={resolvedView === "gantt" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={handleNavigateToGantt}
                  className={cn(
                    "h-6 gap-1.5 rounded-md px-2 text-xs",
                    resolvedView !== "gantt" && "text-muted-foreground",
                  )}
                >
                  <CalendarDays className="size-3.5" />
                  Gantt
                </Button>
                <Button
                  variant={resolvedView === "calendar" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={handleNavigateToCalendar}
                  className={cn(
                    "h-6 gap-1.5 rounded-md px-2 text-xs",
                    resolvedView !== "calendar" && "text-muted-foreground",
                  )}
                >
                  <Calendar className="size-3.5" />
                  Calendar
                </Button>
                <Button
                  variant={resolvedView === "materials" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={handleNavigateToMaterials}
                  className={cn(
                    "h-6 gap-1.5 rounded-md px-2 text-xs",
                    resolvedView !== "materials" && "text-muted-foreground",
                  )}
                >
                  <Package className="size-3.5" />
                  Materials
                </Button>
                <Button
                  variant={resolvedView === "rfis" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={handleNavigateToRfis}
                  className={cn(
                    "h-6 gap-1.5 rounded-md px-2 text-xs",
                    resolvedView !== "rfis" && "text-muted-foreground",
                  )}
                >
                  <MessageCircleQuestion className="size-3.5" />
                  RFIs
                </Button>
                <Button
                  variant={
                    resolvedView === "changeOrders" ? "secondary" : "ghost"
                  }
                  size="xs"
                  onClick={handleNavigateToChangeOrders}
                  className={cn(
                    "h-6 gap-1.5 rounded-md px-2 text-xs",
                    resolvedView !== "changeOrders" && "text-muted-foreground",
                  )}
                >
                  <FileWarning className="size-3.5" />
                  Change Orders
                </Button>
                <Button
                  variant={
                    resolvedView === "submittals" ? "secondary" : "ghost"
                  }
                  size="xs"
                  onClick={handleNavigateToSubmittals}
                  className={cn(
                    "h-6 gap-1.5 rounded-md px-2 text-xs",
                    resolvedView !== "submittals" && "text-muted-foreground",
                  )}
                >
                  <FileCheck2 className="size-3.5" />
                  Submittals
                </Button>
                <Button
                  variant={resolvedView === "permits" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={handleNavigateToPermits}
                  className={cn(
                    "h-6 gap-1.5 rounded-md px-2 text-xs",
                    resolvedView !== "permits" && "text-muted-foreground",
                  )}
                >
                  <Stamp className="size-3.5" />
                  Permits
                </Button>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {headerActions}
          </div>
        </div>
      </Layout.Header>

      <Layout.Content>{children}</Layout.Content>

      <CreateProjectModal
        open={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
      />
    </Layout>
  );
}
