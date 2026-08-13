import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import useUpdateChangeOrder from "@/hooks/mutations/change-order/use-update-change-order";
import type useGetChangeOrders from "@/hooks/queries/change-order/use-get-change-orders";
import { formatCurrencyFromCents } from "@/lib/format-currency";
import { toast } from "@/lib/toast";
import ChangeOrderStatusBadge, {
  type ChangeOrderStatus,
} from "./change-order-status-badge";

type ChangeOrder = NonNullable<
  ReturnType<typeof useGetChangeOrders>["data"]
>[number];

type ChangeOrderDetailPanelProps = {
  changeOrder: ChangeOrder;
  projectId: string;
  canEdit: boolean;
  open: boolean;
  onClose: () => void;
};

export default function ChangeOrderDetailPanel({
  changeOrder,
  projectId,
  canEdit,
  open,
  onClose,
}: ChangeOrderDetailPanelProps) {
  const { t } = useTranslation();
  const [decisionNote, setDecisionNote] = useState(
    changeOrder.decisionNote ?? "",
  );
  const { mutateAsync: updateChangeOrder, isPending } =
    useUpdateChangeOrder(projectId);

  useEffect(() => {
    setDecisionNote(changeOrder.decisionNote ?? "");
  }, [changeOrder.decisionNote]);

  const handleDecision = async (status: "approved" | "rejected") => {
    try {
      await updateChangeOrder({
        id: changeOrder.id,
        status,
        decisionNote: decisionNote.trim() || null,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("changeOrder:detail.decisionFailed", "Failed to record decision"),
      );
    }
  };

  const handleReopen = async () => {
    try {
      await updateChangeOrder({ id: changeOrder.id, status: "pending_review" });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("changeOrder:detail.statusFailed", "Failed to update status"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              CO-{changeOrder.number}: {changeOrder.title}
            </DialogTitle>
            <ChangeOrderStatusBadge
              status={changeOrder.status as ChangeOrderStatus}
            />
          </div>
          <DialogDescription className="whitespace-pre-wrap">
            {changeOrder.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <Label className="text-muted-foreground">
              {t("changeOrder:form.costImpact", "Cost impact")}
            </Label>
            <p className="mt-1 font-medium">
              {formatCurrencyFromCents(changeOrder.costImpactCents)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">
              {t("changeOrder:form.hoursImpact", "Hours impact")}
            </Label>
            <p className="mt-1 font-medium">
              {changeOrder.hoursImpact != null
                ? `${changeOrder.hoursImpact}h`
                : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="change-order-decision-note">
            {t("changeOrder:detail.decisionNote", "Decision note")}
          </Label>
          <Textarea
            id="change-order-decision-note"
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
            className="min-h-[4rem] resize-none"
            disabled={!canEdit}
            placeholder={t(
              "changeOrder:detail.decisionNotePlaceholder",
              "Optional note explaining the decision…",
            )}
          />
        </div>

        {canEdit && (
          <DialogFooter className="justify-between sm:justify-between">
            {changeOrder.status === "pending_review" ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecision("rejected")}
                  disabled={isPending}
                >
                  {t("changeOrder:detail.reject", "Reject")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleDecision("approved")}
                  disabled={isPending}
                >
                  {t("changeOrder:detail.approve", "Approve")}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReopen}
                disabled={isPending}
              >
                {t("changeOrder:detail.reopen", "Reopen for review")}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
