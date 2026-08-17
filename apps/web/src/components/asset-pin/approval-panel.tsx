import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import useDecideApproval from "@/hooks/mutations/asset-approval/use-decide-approval";
import useRequestApproval from "@/hooks/mutations/asset-approval/use-request-approval";
import useGetApprovalEvents from "@/hooks/queries/asset-approval/use-get-approval-events";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";

type ApprovalStatus = "pending" | "approved" | "changes_requested";

function formatActor(actor: { type: string; name: string | null }) {
  if (actor.name) {
    return actor.type === "guest" ? `${actor.name} (client)` : actor.name;
  }
  return actor.type === "guest" ? "Client" : "Team member";
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-medium text-xs",
        status === "approved" &&
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        status === "pending" &&
          "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        status === "changes_requested" &&
          "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      )}
    >
      {t(`assetPins:approval.badge.${status}`)}
    </span>
  );
}

type ApprovalPanelProps = {
  assetId: string;
};

export default function ApprovalPanel({ assetId }: ApprovalPanelProps) {
  const { t } = useTranslation();
  const { data: events = [] } = useGetApprovalEvents(assetId);
  const { mutateAsync: requestApproval, isPending: isRequesting } =
    useRequestApproval(assetId);
  const { mutateAsync: decideApproval, isPending: isDeciding } =
    useDecideApproval(assetId);
  const [note, setNote] = useState("");

  const latest = events[events.length - 1] as
    | { status: ApprovalStatus }
    | undefined;

  const handleRequest = async () => {
    try {
      await requestApproval();
      toast.success(
        t("assetPins:approval.sendForApprovalSuccess", "Sent for approval"),
      );
    } catch (error) {
      console.error("Failed to request approval:", error);
      toast.error(
        t(
          "assetPins:approval.sendForApprovalFailed",
          "Failed to send for approval",
        ),
      );
    }
  };

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
        assetId,
        decision,
        note: note.trim() || undefined,
      });
      setNote("");
      toast.success(t("assetPins:approval.decideSuccess", "Decision recorded"));
    } catch (error) {
      console.error("Failed to record approval decision:", error);
      toast.error(
        t("assetPins:approval.decideFailed", "Failed to record decision"),
      );
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/70 p-3">
      <div className="flex items-center justify-between gap-2">
        {latest ? (
          <StatusBadge status={latest.status} />
        ) : (
          <span className="text-muted-foreground text-xs">
            {t("assetPins:approval.badge.pending", "No approval requested yet")}
          </span>
        )}
        <Button
          size="xs"
          variant="outline"
          disabled={isRequesting}
          onClick={handleRequest}
        >
          {latest
            ? t(
                "assetPins:approval.resendAfterChanges",
                "Send for approval again",
              )
            : t("assetPins:approval.sendForApproval", "Send for approval")}
        </Button>
      </div>

      {latest?.status === "pending" && (
        <div className="flex flex-col gap-2">
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
              disabled={isDeciding}
              onClick={() => handleDecide("changes_requested")}
            >
              {t("assetPins:approval.requestChanges", "Request changes")}
            </Button>
            <Button
              size="xs"
              variant="default"
              disabled={isDeciding}
              onClick={() => handleDecide("approved")}
            >
              {t("assetPins:approval.approve", "Approve")}
            </Button>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="flex flex-col gap-1.5 border-border/60 border-t pt-2">
          <span className="font-medium text-muted-foreground text-xs">
            {t("assetPins:approval.history", "Approval history")}
          </span>
          {events.map(
            (event: {
              id: string;
              status: ApprovalStatus;
              note: string | null;
              actor: { type: string; name: string | null };
            }) => (
              <div key={event.id} className="text-xs">
                <span className="font-medium">{formatActor(event.actor)}</span>
                {" — "}
                <StatusBadge status={event.status} />
                {event.note && (
                  <p className="mt-0.5 text-muted-foreground">{event.note}</p>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
