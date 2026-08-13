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
import useUpdateRfi from "@/hooks/mutations/rfi/use-update-rfi";
import type useGetRfis from "@/hooks/queries/rfi/use-get-rfis";
import { getInitials } from "@/lib/get-initials";
import { toast } from "@/lib/toast";
import RfiAssigneePopover from "./rfi-assignee-popover";
import RfiDueDatePopover from "./rfi-due-date-popover";
import RfiStatusBadge, { type RfiStatus } from "./rfi-status-badge";

type Rfi = NonNullable<ReturnType<typeof useGetRfis>["data"]>[number];

type RfiDetailPanelProps = {
  rfi: Rfi;
  projectId: string;
  workspaceId: string;
  canEdit: boolean;
  open: boolean;
  onClose: () => void;
};

export default function RfiDetailPanel({
  rfi,
  projectId,
  workspaceId,
  canEdit,
  open,
  onClose,
}: RfiDetailPanelProps) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState(rfi.answer ?? "");
  const { mutateAsync: updateRfi, isPending } = useUpdateRfi(projectId);

  useEffect(() => {
    setAnswer(rfi.answer ?? "");
  }, [rfi.answer]);

  const runUpdate = async (
    input: Parameters<typeof updateRfi>[0],
    failMessage: string,
  ) => {
    try {
      await updateRfi(input);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : failMessage);
    }
  };

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return;
    void runUpdate(
      { id: rfi.id, answer: answer.trim() },
      t("rfi:detail.answerFailed", "Failed to submit answer"),
    );
  };

  const handleSetStatus = (status: RfiStatus) => {
    void runUpdate(
      { id: rfi.id, status },
      t("rfi:detail.statusFailed", "Failed to update status"),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              RFI-{rfi.number}: {rfi.subject}
            </DialogTitle>
            <RfiStatusBadge status={rfi.status as RfiStatus} />
          </div>
          <DialogDescription className="whitespace-pre-wrap">
            {rfi.question}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("rfi:form.assignee", "Assignee")}</Label>
            <RfiAssigneePopover
              workspaceId={workspaceId}
              assignee={rfi.assignee}
              onChange={(userId) =>
                void runUpdate(
                  { id: rfi.id, assigneeUserId: userId },
                  t("rfi:detail.assignFailed", "Failed to update assignee"),
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
                {rfi.assignee ? (
                  <>
                    <Avatar className="size-5">
                      <AvatarImage src="" alt={rfi.assignee.name ?? ""} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(rfi.assignee.name ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{rfi.assignee.name}</span>
                  </>
                ) : (
                  t("rfi:unassigned", "Unassigned")
                )}
              </Button>
            </RfiAssigneePopover>
          </div>
          <div className="space-y-1.5">
            <Label>{t("rfi:form.dueDate", "Due date")}</Label>
            <RfiDueDatePopover
              dueDate={rfi.dueDate}
              onChange={(dueDate) =>
                void runUpdate(
                  { id: rfi.id, dueDate },
                  t("rfi:detail.dueDateFailed", "Failed to update due date"),
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
                {rfi.dueDate
                  ? new Date(rfi.dueDate).toLocaleDateString()
                  : t("rfi:form.setDueDate", "Set due date")}
              </Button>
            </RfiDueDatePopover>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rfi-answer">{t("rfi:detail.answer", "Answer")}</Label>
          <Textarea
            id="rfi-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            className="min-h-[6rem] resize-none"
            disabled={!canEdit}
            placeholder={t(
              "rfi:detail.answerPlaceholder",
              "Write the formal answer…",
            )}
          />
        </div>

        {canEdit && (
          <DialogFooter className="justify-between sm:justify-between">
            <div className="flex gap-2">
              {rfi.status !== "closed" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetStatus("closed")}
                  disabled={isPending}
                >
                  {t("rfi:detail.close", "Close")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetStatus("open")}
                  disabled={isPending}
                >
                  {t("rfi:detail.reopen", "Reopen")}
                </Button>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitAnswer}
              disabled={isPending || !answer.trim()}
            >
              {t("rfi:detail.submitAnswer", "Submit answer")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
