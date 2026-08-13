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
import useCreateSubmittal from "@/hooks/mutations/submittal/use-create-submittal";
import { getInitials } from "@/lib/get-initials";
import { toast } from "@/lib/toast";
import SubmittalAssigneePopover, {
  type SubmittalAssignee,
} from "./submittal-assignee-popover";
import SubmittalDueDatePopover from "./submittal-due-date-popover";

type SubmittalPrefill = {
  title: string;
  specSection: string | null;
  supersedesSubmittalId: string;
};

type SubmittalFormProps = {
  projectId: string;
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  prefill?: SubmittalPrefill | null;
};

export default function SubmittalForm({
  projectId,
  workspaceId,
  open,
  onClose,
  prefill,
}: SubmittalFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [specSection, setSpecSection] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<SubmittalAssignee | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);

  const { mutateAsync: createSubmittal, isPending } =
    useCreateSubmittal(projectId);

  useEffect(() => {
    if (!open) return;
    setTitle(prefill?.title ?? "");
    setSpecSection(prefill?.specSection ?? "");
    setDescription("");
    setAssignee(null);
    setDueDate(null);
  }, [open, prefill]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      await createSubmittal({
        projectId,
        title: title.trim(),
        specSection: specSection.trim() || null,
        description: description.trim(),
        assigneeUserId: assignee?.id ?? null,
        dueDate,
        supersedesSubmittalId: prefill?.supersedesSubmittalId ?? null,
      });
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("submittal:form.saveFailed", "Failed to create submittal"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {prefill
              ? t("submittal:form.resubmitTitle", "Resubmit")
              : t("submittal:form.createTitle", "New submittal")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "submittal:form.description",
              "Track a document sent for review and its decision.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="submittal-title">
                {t("submittal:form.title", "Title")}
              </Label>
              <Input
                id="submittal-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="submittal-spec-section">
                {t("submittal:form.specSection", "Spec section")}
              </Label>
              <Input
                id="submittal-spec-section"
                value={specSection}
                onChange={(event) => setSpecSection(event.target.value)}
                placeholder="03 30 00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="submittal-description">
              {t("submittal:form.descriptionLabel", "Description")}
            </Label>
            <Textarea
              id="submittal-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[6rem] resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("submittal:form.assignee", "Assignee")}</Label>
              <SubmittalAssigneePopover
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
                    t("submittal:unassigned", "Unassigned")
                  )}
                </Button>
              </SubmittalAssigneePopover>
            </div>
            <div className="space-y-1.5">
              <Label>{t("submittal:form.dueDate", "Due date")}</Label>
              <SubmittalDueDatePopover dueDate={dueDate} onChange={setDueDate}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  {dueDate
                    ? new Date(dueDate).toLocaleDateString()
                    : t("submittal:form.setDueDate", "Set due date")}
                </Button>
              </SubmittalDueDatePopover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common:cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {prefill
                ? t("submittal:form.resubmit", "Resubmit")
                : t("submittal:form.create", "Create submittal")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
