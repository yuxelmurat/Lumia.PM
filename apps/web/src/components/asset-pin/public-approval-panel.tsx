import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import useDecidePublicApproval from "@/hooks/mutations/public-asset/use-decide-public-approval";
import { toast } from "@/lib/toast";

type PublicApprovalPanelProps = {
  token: string;
  guestId: string;
  approvalStatus: string | null;
};

export default function PublicApprovalPanel({
  token,
  guestId,
  approvalStatus,
}: PublicApprovalPanelProps) {
  const { t } = useTranslation();
  const { mutateAsync: decideApproval, isPending } =
    useDecidePublicApproval(token);
  const [note, setNote] = useState("");

  if (approvalStatus !== "pending") return null;

  const handleDecide = async (decision: "approved" | "changes_requested") => {
    if (decision === "changes_requested" && !note.trim()) {
      toast.error(
        t(
          "assetPins:approval.missingNote",
          "Please add a note explaining what should change",
        ),
      );
      return;
    }
    try {
      await decideApproval({
        token,
        guestId,
        decision,
        note: note.trim() || undefined,
      });
      setNote("");
      toast.success(t("assetPins:approval.decideSuccess", "Decision recorded"));
    } catch (error) {
      console.error("Failed to record public approval decision:", error);
      toast.error(
        t("assetPins:approval.decideFailed", "Failed to record decision"),
      );
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
      <span className="font-medium text-sm">
        {t(
          "assetPins:approval.guestTitle",
          "This file is pending your approval",
        )}
      </span>
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={t(
          "assetPins:approval.notePlaceholder",
          "Add a note (required for requesting changes)…",
        )}
        className="min-h-[3rem] resize-none text-sm"
      />
      <div className="flex justify-end gap-2">
        <Button
          size="xs"
          variant="outline"
          disabled={isPending}
          onClick={() => handleDecide("changes_requested")}
        >
          {t("assetPins:approval.requestChanges", "Request changes")}
        </Button>
        <Button
          size="xs"
          variant="default"
          disabled={isPending}
          onClick={() => handleDecide("approved")}
        >
          {t("assetPins:approval.approve", "Approve")}
        </Button>
      </div>
    </div>
  );
}
