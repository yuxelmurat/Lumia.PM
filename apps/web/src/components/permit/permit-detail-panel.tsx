import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useUpdatePermit from "@/hooks/mutations/permit/use-update-permit";
import type useGetPermits from "@/hooks/queries/permit/use-get-permits";
import { getInitials } from "@/lib/get-initials";
import { toast } from "@/lib/toast";
import PermitAssigneePopover from "./permit-assignee-popover";
import PermitStatusSelect, { type PermitStatus } from "./permit-status-select";

type Permit = NonNullable<ReturnType<typeof useGetPermits>["data"]>[number];

type PermitDetailPanelProps = {
  permit: Permit;
  projectId: string;
  workspaceId: string;
  canEdit: boolean;
  open: boolean;
  onClose: () => void;
};

export default function PermitDetailPanel({
  permit,
  projectId,
  workspaceId,
  canEdit,
  open,
  onClose,
}: PermitDetailPanelProps) {
  const { t } = useTranslation();
  const [permitNumber, setPermitNumber] = useState(permit.permitNumber ?? "");
  const [notes, setNotes] = useState(permit.notes ?? "");
  const { mutateAsync: updatePermit, isPending } = useUpdatePermit(projectId);

  useEffect(() => {
    setPermitNumber(permit.permitNumber ?? "");
    setNotes(permit.notes ?? "");
  }, [permit.permitNumber, permit.notes]);

  const runUpdate = async (
    input: Parameters<typeof updatePermit>[0],
    failMessage: string,
  ) => {
    try {
      await updatePermit(input);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : failMessage);
    }
  };

  const handleStatusChange = (status: PermitStatus) => {
    void runUpdate(
      { id: permit.id, status },
      t("permit:detail.statusFailed", "Failed to update status"),
    );
  };

  const handleSaveDetails = () => {
    void runUpdate(
      {
        id: permit.id,
        permitNumber: permitNumber.trim() || null,
        notes: notes.trim() || null,
      },
      t("permit:detail.saveFailed", "Failed to save details"),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              PMT-{permit.number}: {permit.jurisdictionName}
            </DialogTitle>
          </div>
        </DialogHeader>

        {permit.permitType && (
          <p className="text-muted-foreground text-sm">
            {t("permit:form.permitType", "Permit type")}:{" "}
            <span className="text-foreground">{permit.permitType}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("permit:detail.status", "Status")}</Label>
            <PermitStatusSelect
              value={permit.status as PermitStatus}
              onChange={handleStatusChange}
              disabled={!canEdit || isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("permit:form.assignee", "Assignee")}</Label>
            <PermitAssigneePopover
              workspaceId={workspaceId}
              assignee={permit.assignee}
              onChange={(userId) =>
                void runUpdate(
                  { id: permit.id, assigneeUserId: userId },
                  t("permit:detail.assignFailed", "Failed to update assignee"),
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
                {permit.assignee ? (
                  <>
                    <Avatar className="size-5">
                      <AvatarImage src="" alt={permit.assignee.name ?? ""} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(permit.assignee.name ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{permit.assignee.name}</span>
                  </>
                ) : (
                  t("permit:unassigned", "Unassigned")
                )}
              </Button>
            </PermitAssigneePopover>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="permit-number">
            {t("permit:detail.permitNumber", "Official permit number")}
          </Label>
          <Input
            id="permit-number"
            value={permitNumber}
            onChange={(event) => setPermitNumber(event.target.value)}
            disabled={!canEdit}
            placeholder={t(
              "permit:detail.permitNumberPlaceholder",
              "Set once issued by the AHJ",
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="permit-notes">
            {t("permit:form.notes", "Notes")}
          </Label>
          <Textarea
            id="permit-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-[5rem] resize-none"
            disabled={!canEdit}
          />
        </div>

        {canEdit && (
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveDetails}
              disabled={isPending}
            >
              {t("permit:detail.save", "Save")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
