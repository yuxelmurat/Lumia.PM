import { useQueryClient } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import useRegenerateTaskPublicLink from "@/hooks/mutations/task/use-regenerate-task-public-link";
import useSetTaskPublicLink from "@/hooks/mutations/task/use-set-task-public-link";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";
import type Task from "@/types/task";

type TaskShareButtonProps = {
  task: Task;
};

// A task's own client-review link, scoped to just this task — the client
// never sees the rest of the project board. Mirrors the project-level
// visibility settings page's toggle/copy/regenerate/expiry pattern, but
// packed into a popover since there's no per-task settings page.
export function TaskShareButton({ task }: TaskShareButtonProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { hasPermission } = useWorkspacePermission();
  const [canShare, setCanShare] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [expiryInput, setExpiryInput] = useState("");
  const lastSavedExpiryRef = useRef("");
  const savingToggleRef = useRef(false);

  const { mutateAsync: setTaskPublicLink } = useSetTaskPublicLink();
  const { mutateAsync: regenerateTaskPublicLink, isPending: isRegenerating } =
    useRegenerateTaskPublicLink();

  useEffect(() => {
    let cancelled = false;
    void hasPermission({ project: ["share"] }).then((ok) => {
      if (!cancelled) setCanShare(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [hasPermission]);

  useEffect(() => {
    const nextValue = task.publicLinkExpiresAt
      ? new Date(task.publicLinkExpiresAt).toISOString().slice(0, 10)
      : "";
    lastSavedExpiryRef.current = nextValue;
    setExpiryInput(nextValue);
  }, [task.publicLinkExpiresAt]);

  const refreshTask = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["task", task.id] });
  }, [queryClient, task.id]);

  const handleToggle = useCallback(async () => {
    if (savingToggleRef.current) return;
    savingToggleRef.current = true;
    try {
      await setTaskPublicLink({
        id: task.id,
        isPublic: !task.isPublic,
        expiresAt: task.publicLinkExpiresAt ?? null,
      });
      await refreshTask();
      toast.success(t("tasks:detail.share.toastUpdated"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("tasks:detail.share.toastUpdateError"),
      );
    } finally {
      savingToggleRef.current = false;
    }
  }, [task.id, task.isPublic, task.publicLinkExpiresAt, setTaskPublicLink, refreshTask, t]);

  const handleSaveExpiry = useCallback(
    async (nextValue: string) => {
      if (nextValue === lastSavedExpiryRef.current) return;
      try {
        await setTaskPublicLink({
          id: task.id,
          isPublic: Boolean(task.isPublic),
          expiresAt: nextValue ? new Date(nextValue).toISOString() : null,
        });
        lastSavedExpiryRef.current = nextValue;
        await refreshTask();
        toast.success(t("tasks:detail.share.expiryToastUpdated"));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("tasks:detail.share.expiryToastUpdateError"),
        );
      }
    },
    [task.id, task.isPublic, setTaskPublicLink, refreshTask, t],
  );

  const handleRegenerate = useCallback(async () => {
    try {
      await regenerateTaskPublicLink({ id: task.id });
      await refreshTask();
      toast.success(t("tasks:detail.share.regenerateToastUpdated"));
      setIsRegenerateModalOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("tasks:detail.share.regenerateToastUpdateError"),
      );
    }
  }, [task.id, regenerateTaskPublicLink, refreshTask, t]);

  const origin = window.location.origin;
  const publicUrl = task.publicShareToken
    ? `${origin}/public-task/${task.publicShareToken}`
    : "";
  const isLinkExpired = Boolean(
    task.publicLinkExpiresAt && new Date(task.publicLinkExpiresAt) < new Date(),
  );

  if (!canShare) return null;

  return (
    <>
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Share2 className="size-3.5" />
              {t("tasks:detail.share.trigger")}
            </Button>
          }
        />
        <PopoverContent className="w-96 space-y-4 p-4" align="end">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                {t("tasks:detail.share.publicAccess")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("tasks:detail.share.publicAccessHint")}
              </p>
            </div>
            <Switch checked={!!task.isPublic} onCheckedChange={handleToggle} />
          </div>

          {task.isPublic && publicUrl ? (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("tasks:detail.share.publicUrl")}
                </Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={publicUrl} className="text-xs" />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl).then(() =>
                        toast.success(t("tasks:detail.share.copiedToast")),
                      );
                    }}
                  >
                    {t("tasks:detail.share.copy")}
                  </Button>
                </div>
                {isLinkExpired ? (
                  <p className="text-xs text-destructive">
                    {t("tasks:detail.share.expiredNotice")}
                  </p>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("tasks:detail.share.expiryLabel")}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="text-xs"
                    value={expiryInput}
                    onChange={(event) => setExpiryInput(event.target.value)}
                    onBlur={(event) => handleSaveExpiry(event.target.value)}
                  />
                  {expiryInput ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setExpiryInput("");
                        handleSaveExpiry("");
                      }}
                    >
                      {t("tasks:detail.share.expiryClear")}
                    </Button>
                  ) : null}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {t("tasks:detail.share.regenerateHint")}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive transition-colors"
                  disabled={isRegenerating}
                  onClick={() => setIsRegenerateModalOpen(true)}
                >
                  {t("tasks:detail.share.regenerateButton")}
                </Button>
              </div>
            </>
          ) : null}
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={isRegenerateModalOpen}
        onOpenChange={setIsRegenerateModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tasks:detail.share.regenerateModalTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tasks:detail.share.regenerateModalDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" />}
            >
              {t("common:actions.cancel")}
            </AlertDialogClose>
            <Button variant="destructive" onClick={handleRegenerate}>
              {t("tasks:detail.share.regenerateConfirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
