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
import useCreatePermit from "@/hooks/mutations/permit/use-create-permit";
import { getInitials } from "@/lib/get-initials";
import { toast } from "@/lib/toast";
import PermitAssigneePopover, {
  type PermitAssignee,
} from "./permit-assignee-popover";

type PermitFormProps = {
  projectId: string;
  workspaceId: string;
  open: boolean;
  onClose: () => void;
};

export default function PermitForm({
  projectId,
  workspaceId,
  open,
  onClose,
}: PermitFormProps) {
  const { t } = useTranslation();
  const [jurisdictionName, setJurisdictionName] = useState("");
  const [permitType, setPermitType] = useState("");
  const [notes, setNotes] = useState("");
  const [assignee, setAssignee] = useState<PermitAssignee | null>(null);

  const { mutateAsync: createPermit, isPending } = useCreatePermit(projectId);

  useEffect(() => {
    if (!open) return;
    setJurisdictionName("");
    setPermitType("");
    setNotes("");
    setAssignee(null);
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!jurisdictionName.trim()) return;

    try {
      await createPermit({
        projectId,
        jurisdictionName: jurisdictionName.trim(),
        permitType: permitType.trim() || null,
        notes: notes.trim() || null,
        assigneeUserId: assignee?.id ?? null,
      });
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("permit:form.saveFailed", "Failed to create permit"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("permit:form.createTitle", "New permit")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "permit:form.description",
              "Track a permit application's status with the local jurisdiction.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="permit-jurisdiction">
                {t("permit:form.jurisdictionName", "Jurisdiction")}
              </Label>
              <Input
                id="permit-jurisdiction"
                value={jurisdictionName}
                onChange={(event) => setJurisdictionName(event.target.value)}
                placeholder={t(
                  "permit:form.jurisdictionPlaceholder",
                  "Seattle DCI",
                )}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="permit-type">
                {t("permit:form.permitType", "Permit type")}
              </Label>
              <Input
                id="permit-type"
                value={permitType}
                onChange={(event) => setPermitType(event.target.value)}
                placeholder={t(
                  "permit:form.permitTypePlaceholder",
                  "Building permit",
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("permit:form.assignee", "Assignee")}</Label>
            <PermitAssigneePopover
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
                  t("permit:unassigned", "Unassigned")
                )}
              </Button>
            </PermitAssigneePopover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="permit-notes">
              {t("permit:form.notes", "Notes")}
            </Label>
            <Textarea
              id="permit-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[4rem] resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common:cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t("permit:form.create", "Create permit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
