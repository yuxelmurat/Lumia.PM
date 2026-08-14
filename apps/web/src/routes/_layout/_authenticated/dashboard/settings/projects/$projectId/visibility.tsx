import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageTitle from "@/components/page-title";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import useRegeneratePublicLink from "@/hooks/mutations/project/use-regenerate-public-link";
import useSetPublicLinkExpiry from "@/hooks/mutations/project/use-set-public-link-expiry";
import useUpdateProject from "@/hooks/mutations/project/use-update-project";
import useGetProject from "@/hooks/queries/project/use-get-project";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/projects/$projectId/visibility",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { projectId } = useParams({ strict: false });
  const { data: workspace } = useActiveWorkspace();
  const { data: project } = useGetProject({
    id: projectId || "",
    workspaceId: workspace?.id || "",
  });

  const queryClient = useQueryClient();
  const { mutateAsync: updateProject } = useUpdateProject();
  const { mutateAsync: setPublicLinkExpiry, isPending: isSavingExpiry } =
    useSetPublicLinkExpiry();
  const { mutateAsync: regeneratePublicLink, isPending: isRegenerating } =
    useRegeneratePublicLink();
  const { hasPermission } = useWorkspacePermission();
  const savingRef = useRef(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [expiryInput, setExpiryInput] = useState("");
  const lastSavedExpiryRef = useRef("");
  // `project:share` isn't in CAPABILITIES (only admin/owner/custom roles
  // with it can flip visibility), so use the generic server check. Result
  // isn't cached, but visibility is a rarely-toggled setting page.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void hasPermission({ project: ["share"] }).then((ok) => {
      if (!cancelled) setCanShare(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [hasPermission]);

  const refreshProjectQueries = useCallback(
    async (projectId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({
          queryKey: ["projects", workspace?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projects", workspace?.id, projectId],
        }),
      ]);
    },
    [queryClient, workspace?.id],
  );

  const handleToggle = useCallback(async () => {
    if (!project) return;
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await updateProject({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description || "",
        icon: project.icon || "Layout",
        isPublic: !project.isPublic,
      });
      await refreshProjectQueries(project.id);
      toast.success(t("settings:projectVisibility.toastUpdated"));
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : t("settings:projectVisibility.toastUpdateError"),
      );
    } finally {
      savingRef.current = false;
    }
  }, [project, updateProject, refreshProjectQueries, t]);

  useEffect(() => {
    if (!project) return;
    const nextValue = project.publicLinkExpiresAt
      ? new Date(project.publicLinkExpiresAt).toISOString().slice(0, 10)
      : "";
    lastSavedExpiryRef.current = nextValue;
    setExpiryInput(nextValue);
  }, [project]);

  const handleSaveExpiry = useCallback(
    async (nextValue: string) => {
      if (!project) return;
      if (nextValue === lastSavedExpiryRef.current) return;
      try {
        await setPublicLinkExpiry({
          id: project.id,
          expiresAt: nextValue ? new Date(nextValue).toISOString() : null,
        });
        lastSavedExpiryRef.current = nextValue;
        await refreshProjectQueries(project.id);
        toast.success(t("settings:projectVisibility.expiryToastUpdated"));
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : t("settings:projectVisibility.expiryToastUpdateError"),
        );
      }
    },
    [project, setPublicLinkExpiry, refreshProjectQueries, t],
  );

  const handleRegenerateLink = useCallback(async () => {
    if (!project) return;
    try {
      await regeneratePublicLink({ id: project.id });
      await refreshProjectQueries(project.id);
      toast.success(t("settings:projectVisibility.regenerateToastUpdated"));
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : t("settings:projectVisibility.regenerateToastUpdateError"),
      );
    }
  }, [project, regeneratePublicLink, refreshProjectQueries, t]);

  const origin = window.location.origin;

  const publicToken = project?.publicShareToken ?? project?.id;
  const publicUrl = publicToken
    ? `${origin}/public-project/${publicToken}`
    : "";
  const isLinkExpired = Boolean(
    project?.publicLinkExpiresAt &&
      new Date(project.publicLinkExpiresAt) < new Date(),
  );

  return (
    <>
      <PageTitle title={t("settings:projectVisibility.pageTitle")} />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {t("settings:projectVisibility.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("settings:projectVisibility.subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-md font-medium">
              {t("settings:projectVisibility.sectionTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings:projectVisibility.sectionSubtitle")}
            </p>
          </div>

          <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  {t("settings:projectVisibility.publicAccess")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings:projectVisibility.publicAccessHint")}
                </p>
              </div>
              <Switch
                checked={!!project?.isPublic}
                onCheckedChange={canShare ? handleToggle : undefined}
                disabled={!canShare}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  {t("settings:projectVisibility.publicUrl")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings:projectVisibility.publicUrlHint")}
                </p>
              </div>
              <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
                <Input readOnly value={publicUrl} className="w-full sm:w-96" />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!publicUrl) return;
                    navigator.clipboard
                      .writeText(publicUrl)
                      .then(() =>
                        toast.success(
                          t("settings:projectVisibility.copiedToast"),
                        ),
                      );
                  }}
                >
                  {t("settings:projectVisibility.copy")}
                </Button>
              </div>
            </div>

            {isLinkExpired ? (
              <p className="text-xs text-destructive">
                {t("settings:projectVisibility.expiredNotice")}
              </p>
            ) : null}

            <Separator />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  {t("settings:projectVisibility.expiryLabel")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings:projectVisibility.expiryHint")}
                </p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Input
                  type="date"
                  className="w-full sm:w-48"
                  value={expiryInput}
                  disabled={!canShare || isSavingExpiry}
                  onChange={(event) => setExpiryInput(event.target.value)}
                  onBlur={(event) => handleSaveExpiry(event.target.value)}
                />
                {expiryInput ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canShare || isSavingExpiry}
                    onClick={() => {
                      setExpiryInput("");
                      handleSaveExpiry("");
                    }}
                  >
                    {t("settings:projectVisibility.expiryClear")}
                  </Button>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  {t("settings:projectVisibility.regenerateLabel")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings:projectVisibility.regenerateHint")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={!canShare || isRegenerating}
                onClick={() => setIsRegenerateModalOpen(true)}
              >
                {t("settings:projectVisibility.regenerateButton")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={isRegenerateModalOpen}
        onOpenChange={setIsRegenerateModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings:projectVisibility.regenerateModalTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings:projectVisibility.regenerateModalDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" size="sm" />}>
              {t("common:actions.cancel")}
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isRegenerating}
                  onClick={handleRegenerateLink}
                />
              }
            >
              {t("settings:projectVisibility.regenerateModalConfirm")}
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
