import {
  Calendar,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  ExternalLink as ExternalLinkIcon,
  GitBranch,
  GitMerge,
  GitPullRequest,
  MessageCircleWarning,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogPopup } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useSetPublicTaskApproval from "@/hooks/mutations/project/use-set-public-task-approval";
import { cn } from "@/lib/cn";
import {
  dueDateStatusColors,
  getDueDateStatus,
  isTaskCompleted,
} from "@/lib/due-date-status";
import {
  formatDateMedium,
  formatDateShort,
  formatDateTime,
} from "@/lib/format";
import { getInitials } from "@/lib/get-initials";
import { getPriorityIcon } from "@/lib/priority";
import { toast } from "@/lib/toast";
import type { ExternalLink } from "@/types/external-link";
import type Task from "@/types/task";
import { MarkdownRenderer } from "./markdown-renderer";
import { PublicTaskLabels } from "./public-task-labels";

type PublicTaskDetailModalProps = {
  task:
    | (Task & {
        labels?: Array<{ id: string; name: string; color: string }>;
        externalLinks?: Array<ExternalLink>;
      })
    | null;
  projectSlug: string;
  // The modal is opened from any column, so it resolves completion by slug
  // rather than being told; without these it falls back to the slug heuristic.
  columns?: Array<{ slug: string; isFinal: boolean }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PublicTaskDetailModal({
  task,
  projectSlug,
  columns,
  open,
  onOpenChange,
}: PublicTaskDetailModalProps) {
  const taskIsCompleted = isTaskCompleted(task?.status ?? "", columns);
  const { t } = useTranslation();

  const [pendingAction, setPendingAction] = useState<
    "approved" | "changes_requested" | null
  >(null);
  const [clientName, setClientName] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);

  const setApproval = useSetPublicTaskApproval();

  // Discard any in-progress response form when a different task is opened
  // or the modal is closed, so it never resurfaces stale draft state.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on task/open change
  useEffect(() => {
    setPendingAction(null);
    setClientName("");
    setNote("");
    setNameError(false);
  }, [task?.id, open]);

  const closeApprovalForm = () => {
    setPendingAction(null);
    setClientName("");
    setNote("");
    setNameError(false);
  };

  const openApprovalForm = (action: "approved" | "changes_requested") => {
    setPendingAction(action);
    setClientName(task?.approvalClientName ?? "");
    setNote(action === "changes_requested" ? (task?.approvalNote ?? "") : "");
    setNameError(false);
  };

  const handleSubmitApproval = async () => {
    if (!task || !pendingAction) return;

    const trimmedName = clientName.trim();
    if (!trimmedName) {
      setNameError(true);
      return;
    }

    try {
      await setApproval.mutateAsync({
        projectId: task.projectId,
        taskId: task.id,
        status: pendingAction,
        clientName: trimmedName,
        note: pendingAction === "changes_requested" ? note.trim() : undefined,
      });
      toast.success(t("publicProject:approval.submitSuccess"));
      closeApprovalForm();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("publicProject:approval.submitError"),
      );
    }
  };

  const getPRStatus = useMemo(
    () => (pr: { metadata?: { merged?: boolean; draft?: boolean } | null }) => {
      if (pr.metadata?.merged) {
        return {
          icon: <GitMerge className="w-3.5 h-3.5" />,
          label: t("publicProject:taskDetail.prStatusMerged"),
          className: "text-info-foreground",
        };
      }
      if (pr.metadata?.draft) {
        return {
          icon: <GitPullRequest className="w-3.5 h-3.5" />,
          label: t("publicProject:taskDetail.prStatusDraft"),
          className: "text-muted-foreground",
        };
      }
      return {
        icon: <GitPullRequest className="w-3.5 h-3.5" />,
        label: t("publicProject:taskDetail.prStatusOpen"),
        className: "text-success-foreground",
      };
    },
    [t],
  );

  if (!task) return null;

  const labels = task.labels || [];
  const externalLinks = task.externalLinks || [];

  const pullRequests = externalLinks.filter(
    (link) => link.resourceType === "pull_request",
  );
  const issues = externalLinks.filter((link) => link.resourceType === "issue");
  const branches = externalLinks.filter(
    (link) => link.resourceType === "branch",
  );

  const statusLabel = task.status ? t(`tasks:status.${task.status}`) : "";
  const priorityLabel =
    task.priority != null && task.priority !== ""
      ? t(`tasks:priority.${task.priority}`)
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="w-full max-w-4xl max-h-[85vh] p-0">
        <div className="bg-background border border-border rounded-xl flex flex-col max-h-[85vh] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                {projectSlug.toUpperCase()}-{task.number}
              </span>
              {statusLabel ? (
                <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded-md shrink-0">
                  {statusLabel}
                </span>
              ) : null}
            </div>
            <DialogClose
              className="shrink-0 p-1.5 hover:bg-muted rounded transition-colors"
              render={<button type="button" />}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </DialogClose>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div className="space-y-3">
              <h2 className="pr-8 text-2xl font-heading font-semibold leading-tight text-foreground">
                {task.title}
              </h2>

              <div className="flex flex-wrap gap-2">
                {task.priority && priorityLabel && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-muted text-muted-foreground rounded-md">
                    {getPriorityIcon(task.priority)}
                    <span>{priorityLabel}</span>
                  </div>
                )}

                {task.dueDate && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md ${dueDateStatusColors[getDueDateStatus(task.dueDate, taskIsCompleted)]}`}
                  >
                    {getDueDateStatus(task.dueDate, taskIsCompleted) ===
                      "overdue" && <CalendarX className="w-3 h-3" />}
                    {getDueDateStatus(task.dueDate, taskIsCompleted) ===
                      "due-soon" && <CalendarClock className="w-3 h-3" />}
                    {(getDueDateStatus(task.dueDate, taskIsCompleted) ===
                      "far-future" ||
                      getDueDateStatus(task.dueDate, taskIsCompleted) ===
                        "no-due-date") && <Calendar className="w-3 h-3" />}
                    <span>
                      {t("publicProject:taskDetail.dueWithDate", {
                        date: formatDateShort(task.dueDate),
                      })}
                    </span>
                  </div>
                )}

                {task.assigneeName && (
                  <div className="flex items-center gap-2 px-2.5 py-1 text-xs bg-muted text-muted-foreground rounded-md">
                    <Avatar className="h-4 w-4">
                      <AvatarImage
                        src={task.assigneeImage ?? ""}
                        alt={task.assigneeName ?? ""}
                      />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(task.assigneeName)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{task.assigneeName}</span>
                  </div>
                )}
              </div>
            </div>

            {task.description && (
              <div className="pt-1">
                <MarkdownRenderer content={task.description} />
              </div>
            )}

            {labels.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("publicProject:taskDetail.labels")}
                </h3>
                <PublicTaskLabels labels={labels} />
              </div>
            )}

            {externalLinks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("publicProject:taskDetail.externalLinks")}
                </h3>

                {pullRequests.length > 0 && (
                  <div className="space-y-2">
                    {pullRequests.map((pr) => {
                      const status = getPRStatus(pr);
                      const repoMatch = pr.url.match(
                        /github\.com\/([^/]+\/[^/]+)\/pull/,
                      );
                      const repoName = repoMatch ? repoMatch[1] : null;
                      return (
                        <a
                          key={pr.id}
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-md border border-border/50 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <span className="text-sm font-medium text-foreground truncate">
                                {pr.title || t("tasks:pr.label")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {repoName}#{pr.externalId}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs font-medium flex items-center gap-1 ${status.className}`}
                            >
                              {status.icon}
                              {status.label}
                            </span>
                            <ExternalLinkIcon className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}

                {issues.length > 0 && (
                  <div className="space-y-2">
                    {issues.map((issue) => (
                      <a
                        key={issue.id}
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-md border border-border/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <GitPullRequest className="w-3.5 h-3.5 text-muted-foreground" />
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">
                              {issue.title ||
                                t("publicProject:taskDetail.issueFallback")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              #{issue.externalId}
                            </span>
                          </div>
                        </div>
                        <ExternalLinkIcon className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}

                {branches.length > 0 && (
                  <div className="space-y-2">
                    {branches.map((branch) => (
                      <a
                        key={branch.id}
                        href={branch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-md border border-border/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground truncate">
                            {branch.title || branch.externalId}
                          </span>
                        </div>
                        <ExternalLinkIcon className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {t("publicProject:taskDetail.created")}
                </div>
                <div className="text-sm text-foreground">
                  {formatDateMedium(task.createdAt)}
                </div>
              </div>
              {task.dueDate && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("publicProject:taskDetail.dueDateLabel")}
                  </div>
                  <div className="text-sm text-foreground">
                    {formatDateMedium(task.dueDate)}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("publicProject:approval.sectionTitle")}
              </h3>

              {task.approvalStatus && (
                <div
                  className={cn(
                    "flex flex-col gap-1.5 p-3 rounded-md border",
                    task.approvalStatus === "approved"
                      ? "bg-success/8 border-success/16"
                      : "bg-warning/8 border-warning/16",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        task.approvalStatus === "approved"
                          ? "success"
                          : "warning"
                      }
                      className="gap-1 px-2 py-0.5 text-[10px] font-medium"
                    >
                      {task.approvalStatus === "approved" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <MessageCircleWarning className="w-3 h-3" />
                      )}
                      {task.approvalStatus === "approved"
                        ? t("publicProject:approval.statusApproved")
                        : t("publicProject:approval.statusChangesRequested")}
                    </Badge>
                    {task.approvalClientName && (
                      <span className="text-xs text-muted-foreground">
                        {t("publicProject:approval.respondedAs", {
                          name: task.approvalClientName,
                        })}
                      </span>
                    )}
                  </div>
                  {task.approvalRespondedAt && (
                    <span className="text-xs text-muted-foreground">
                      {t("publicProject:approval.respondedOn", {
                        date: formatDateTime(task.approvalRespondedAt),
                      })}
                    </span>
                  )}
                  {task.approvalNote && (
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {task.approvalNote}
                    </p>
                  )}
                </div>
              )}

              {pendingAction ? (
                <div className="flex flex-col gap-2.5 p-3 rounded-md border border-border bg-muted/30">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="approval-client-name"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {t("publicProject:approval.nameLabel")}
                    </label>
                    <Input
                      id="approval-client-name"
                      value={clientName}
                      placeholder={t("publicProject:approval.namePlaceholder")}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        if (e.target.value.trim()) setNameError(false);
                      }}
                      aria-invalid={nameError || undefined}
                    />
                    {nameError && (
                      <span className="text-xs text-destructive">
                        {t("publicProject:approval.nameRequired")}
                      </span>
                    )}
                  </div>

                  {pendingAction === "changes_requested" && (
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="approval-note"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        {t("publicProject:approval.noteLabel")}
                      </label>
                      <Textarea
                        id="approval-note"
                        value={note}
                        placeholder={t(
                          "publicProject:approval.notePlaceholder",
                        )}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeApprovalForm}
                      disabled={setApproval.isPending}
                    >
                      {t("publicProject:approval.cancel")}
                    </Button>
                    <Button
                      variant={
                        pendingAction === "approved" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={handleSubmitApproval}
                      disabled={setApproval.isPending}
                    >
                      {t("publicProject:approval.submit")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant={
                      task.approvalStatus === "approved" ? "outline" : "default"
                    }
                    size="sm"
                    onClick={() => openApprovalForm("approved")}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t("publicProject:approval.approveButton")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openApprovalForm("changes_requested")}
                    className="gap-1.5"
                  >
                    <MessageCircleWarning className="w-3.5 h-3.5" />
                    {t("publicProject:approval.requestChangesButton")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
