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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useCreateRfi from "@/hooks/mutations/rfi/use-create-rfi";
import { getInitials } from "@/lib/get-initials";
import { toast } from "@/lib/toast";
import RfiAssigneePopover, { type RfiAssignee } from "./rfi-assignee-popover";
import RfiDueDatePopover from "./rfi-due-date-popover";

type RfiFormProps = {
  projectId: string;
  workspaceId: string;
  open: boolean;
  onClose: () => void;
};

export default function RfiForm({
  projectId,
  workspaceId,
  open,
  onClose,
}: RfiFormProps) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [assignee, setAssignee] = useState<RfiAssignee | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);

  const { mutateAsync: createRfi, isPending } = useCreateRfi(projectId);

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setQuestion("");
    setAssignee(null);
    setDueDate(null);
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !question.trim()) return;

    try {
      await createRfi({
        projectId,
        subject: subject.trim(),
        question: question.trim(),
        assigneeUserId: assignee?.id ?? null,
        dueDate,
      });
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("rfi:form.saveFailed", "Failed to create RFI"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("rfi:form.createTitle", "New RFI")}</DialogTitle>
          <DialogDescription>
            {t(
              "rfi:form.description",
              "Ask the design team a formal question and track the answer.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rfi-subject">
              {t("rfi:form.subject", "Subject")}
            </Label>
            <Input
              id="rfi-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rfi-question">
              {t("rfi:form.question", "Question")}
            </Label>
            <Textarea
              id="rfi-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="min-h-[6rem] resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("rfi:form.assignee", "Assignee")}</Label>
              <RfiAssigneePopover
                workspaceId={workspaceId}
                assignee={assignee}
                onChange={(userId) =>
                  setAssignee(userId ? { id: userId, name: null } : null)
                }
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  {assignee ? (
                    <>
                      <Avatar className="size-5">
                        <AvatarImage src="" alt={assignee.name ?? ""} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(assignee.name ?? "")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{assignee.name}</span>
                    </>
                  ) : (
                    t("rfi:unassigned", "Unassigned")
                  )}
                </Button>
              </RfiAssigneePopover>
            </div>
            <div className="space-y-1.5">
              <Label>{t("rfi:form.dueDate", "Due date")}</Label>
              <RfiDueDatePopover dueDate={dueDate} onChange={setDueDate}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  {dueDate
                    ? new Date(dueDate).toLocaleDateString()
                    : t("rfi:form.setDueDate", "Set due date")}
                </Button>
              </RfiDueDatePopover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common:cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t("rfi:form.create", "Create RFI")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
