import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageTitle from "@/components/page-title";
import { ErrorView } from "@/components/public-project/error-view";
import { LoadingSkeleton } from "@/components/public-project/loading-skeleton";
import { ProductBranding } from "@/components/public-project/product-branding";
import { PublicTaskDetailModal } from "@/components/public-project/task-detail-modal";
import { ThemeToggle } from "@/components/public-project/theme-toggle";
import useGetPublicTask from "@/hooks/queries/task/use-get-public-task";
import { getContrastingTextColor, isValidHexColor } from "@/lib/contrast-color";

export const Route = createFileRoute("/public-task/$token")({
  component: RouteComponent,
});

// A single task's own client-review link: the viewer sees only this task
// (title, description, images, approval, pin comments) — never the rest of
// the project board. Reuses the same detail UI as the project board's task
// modal (PublicTaskDetailModal), just rendered as a page instead of a
// dialog and wired to the task-token endpoints (shareMode="task").
function RouteComponent() {
  const { t } = useTranslation();
  const { token } = Route.useParams();
  const { data: task, isLoading, error } = useGetPublicTask(token);

  const accentColor = task?.workspaceAccentColor;
  useEffect(() => {
    if (!accentColor || !isValidHexColor(accentColor)) return;

    const root = document.documentElement.style;
    const previous = {
      primary: root.getPropertyValue("--primary"),
      primaryForeground: root.getPropertyValue("--primary-foreground"),
      ring: root.getPropertyValue("--ring"),
    };

    root.setProperty("--primary", accentColor);
    root.setProperty(
      "--primary-foreground",
      getContrastingTextColor(accentColor),
    );
    root.setProperty("--ring", accentColor);

    return () => {
      root.setProperty("--primary", previous.primary);
      root.setProperty("--primary-foreground", previous.primaryForeground);
      root.setProperty("--ring", previous.ring);
    };
  }, [accentColor]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !task) {
    return <ErrorView />;
  }

  return (
    <>
      <PageTitle title={task.title} />
      <div className="h-svh bg-background flex flex-col w-full">
        <header className="border-b border-border sticky top-0 z-10 bg-background">
          {task.workspaceName || task.workspaceLogo ? (
            <div className="px-6 py-2 border-b border-border/60 bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {task.workspaceLogo ? (
                    <img
                      src={task.workspaceLogo}
                      alt={task.workspaceName ?? ""}
                      className="h-6 w-6 rounded object-contain"
                    />
                  ) : null}
                  {task.workspaceName ? (
                    <span className="text-sm font-medium text-foreground truncate">
                      {task.workspaceName}
                    </span>
                  ) : null}
                  {task.projectName ? (
                    <span className="text-xs text-muted-foreground truncate">
                      · {task.projectName}
                    </span>
                  ) : null}
                </div>
                <ThemeToggle />
              </div>
            </div>
          ) : (
            <div className="px-6 py-2 flex justify-end">
              <ThemeToggle />
            </div>
          )}
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto py-6 px-4">
          <div className="mx-auto w-full max-w-4xl">
            <PublicTaskDetailModal
              task={task}
              projectSlug=""
              publicToken={token}
              shareMode="task"
              standalone
              open
              onOpenChange={() => {}}
            />
          </div>
        </main>

        <footer className="border-t border-border">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <ProductBranding />
              <span>{t("publicProject:readOnly")}</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
