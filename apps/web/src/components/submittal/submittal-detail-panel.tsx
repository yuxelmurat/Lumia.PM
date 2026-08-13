import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useUpdateSubmittal from "@/hooks/mutations/submittal/use-update-submittal";
import type useGetSubmittals from "@/hooks/queries/submittal/use-get-submittals";
import { getInitials } from "@/lib/get-initials";
import { toast } from "@/lib/toast";
import SubmittalAssigneePopover from "./submittal-assignee-popover";
import SubmittalDueDatePopover from "./submittal-due-date-popover";
import SubmittalStatusBadge, {
  type SubmittalStatus,
} from "./submittal-status-badge";

type Submittal = NonNullable<
  ReturnType<typeof useGetSubmittals>["data"]
>[number];

type SubmittalDetailPanelProps = {
  submittal: Submittal;
  projectId: string;
  workspaceId: string;
  canEdit: boolean;
  open: boolean;
  onClose: () => void;
  onResubmit: (submittal: Submittal) => void;
};

export default function SubmittalDetailPanel({
  submittal,
  projectId,
  workspaceId,
  canEdit,
  open,
  onClose,
  onResubmit,
}: SubmittalDetailPanelProps) {
  const { t } = useTranslation();
  const [reviewNote, setReviewNote] = useState(submittal.reviewNote ?? "");
  const { mutateAsync: updateSubmittal, isPending } =
    useUpdateSubmittal(projectId);

  useEffect(() => {
    setReviewNote(submittal.reviewNote ?? "");
  }, [submittal.reviewNote]);

  const runUpdate = async (
    input: Parameters<typeof updateSubmittal>[0],
    failMessage: string,
  ) => {
    try {
      await updateSubmittal(input);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : failMessage);
    }
  };

  const handleDecision = (status: "approved" | "revise_resubmit") => {
    void runUpdate(
      { id: submittal.id, status, reviewNote: reviewNote.trim() || null },
      t("submittal:detail.decisionFailed", "Failed to record decision"),
    );
  };

  const handleReopen = () => {
    void runUpdate(
      { id: submittal.id, status: "open" },
      t("submittal:detail.statusFailed", "Failed to update status"),
    );
  };

  const handleClose = () => {
    void runUpdate(
      { id: submittal.id, status: "closed" },
      t("submittal:detail.statusFailed", "Failed to update status"),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              SUB-{submittal.number}: {submittal.title}
            </DialogTitle>
            <SubmittalStatusBadge
              status={submittal.status as SubmittalStatus}
            />
          </div>
          <DialogDescription className="whitespace-pre-wrap">
            {submittal.description}
          </DialogDescription>
        </DialogHeader>

        {submittal.specSection && (
          <p className="text-muted-foreground text-sm">
            {t("submittal:form.specSection", "Spec section")}:{" "}
            <span className="text-foreground">{submittal.specSection}</span>
          </p>
        )}

        {submittal.supersedesSubmittalNumber != null && (
          <p className="text-muted-foreground text-sm">
            {t("submittal:detail.supersedes", "Supersedes")} SUB-
            {submittal.supersedesSubmittalNumber}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("submittal:form.assignee", "Assignee")}</Label>
            <SubmittalAssigneePopover
              workspaceId={workspaceId}
              assignee={submittal.assignee}
              onChange={(userId) =>
                void runUpdate(
                  { id: submittal.id, assigneeUserId: userId },
                  t(
                    "submittal:detail.assignFailed",
                    "Failed to update assignee",
                  ),
                )
              }
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                disabled={!canEdit}
              >
                {submittal.assignee ? (
                  <>
                    <Avatar className="size-5">
                      <AvatarImage src="" alt={submittal.assignee.name ?? ""} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(submittal.assignee.name ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{submittal.assignee.name}</span>
                  </>
                ) : (
                  t("submittal:unassigned", "Unassigned")
                )}
              </Button>
            </SubmittalAssigneePopover>
          </div>
          <div className="space-y-1.5">
            <Label>{t("submittal:form.dueDate", "Due date")}</Label>
            <SubmittalDueDatePopover
              dueDate={submittal.dueDate}
              onChange={(dueDate) =>
                void runUpdate(
                  { id: submittal.id, dueDate },
                  t(
                    "submittal:detail.dueDateFailed",
                    "Failed to update due date",
                  ),
                )
              }
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled={!canEdit}
              >
                {submittal.dueDate
                  ? new Date(submittal.dueDate).toLocaleDateString()
                  : t("submittal:form.setDueDate", "Set due date")}
              </Button>
            </SubmittalDueDatePopover>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="submittal-review-note">
            {t("submittal:detail.reviewNote", "Review note")}
          </Label>
          <Textarea
            id="submittal-review-note"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            className="min-h-[5rem] resize-none"
            disabled={!canEdit}
            placeholder={t(
              "submittal:detail.reviewNotePlaceholder",
              "Notes for the reviewer's decision…",
            )}
          />
        </div>

        {submittal.reviewedByUserName && (
          <p className="text-muted-foreground text-xs">
            {t("submittal:detail.reviewedBy", "Reviewed by")}{" "}
            {submittal.reviewedByUserName}
            {submittal.reviewedAt &&
              ` · ${new Date(submittal.reviewedAt).toLocaleDateString()}`}
          </p>
        )}

        {canEdit && (
          <DialogFooter className="flex-wrap justify-between gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {submittal.status === "closed" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReopen}
                  disabled={isPending}
                >
                  {t("submittal:detail.reopen", "Reopen")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  {t("submittal:detail.close", "Close")}
                </Button>
              )}
              {submittal.status === "revise_resubmit" && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => onResubmit(submittal)}
                  disabled={isPending}
                >
                  {t("submittal:detail.resubmit", "Resubmit")}
                </Button>
              )}
            </div>
            {(submittal.status === "open" ||
              submittal.status === "revise_resubmit") && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecision("revise_resubmit")}
                  disabled={isPending}
                >
                  {t("submittal:detail.reviseResubmit", "Revise & resubmit")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleDecision("approved")}
                  disabled={isPending}
                >
                  {t("submittal:detail.approve", "Approve")}
                </Button>
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
