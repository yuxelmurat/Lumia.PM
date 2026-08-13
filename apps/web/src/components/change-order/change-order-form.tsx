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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useCreateChangeOrder from "@/hooks/mutations/change-order/use-create-change-order";
import { toast } from "@/lib/toast";

type ChangeOrderFormProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

export default function ChangeOrderForm({
  projectId,
  open,
  onClose,
}: ChangeOrderFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [costImpact, setCostImpact] = useState("");
  const [hoursImpact, setHoursImpact] = useState("");

  const { mutateAsync: createChangeOrder, isPending } =
    useCreateChangeOrder(projectId);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setCostImpact("");
    setHoursImpact("");
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const parsedCostImpactCents = costImpact.trim()
      ? Math.round(Number.parseFloat(costImpact) * 100)
      : null;
    const parsedHoursImpact = hoursImpact.trim()
      ? Number.parseInt(hoursImpact, 10)
      : null;

    try {
      await createChangeOrder({
        projectId,
        title: title.trim(),
        description: description.trim(),
        costImpactCents: parsedCostImpactCents,
        hoursImpact: parsedHoursImpact,
      });
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("changeOrder:form.saveFailed", "Failed to create change order"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("changeOrder:form.createTitle", "New change order")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "changeOrder:form.description",
              "Log a client-requested scope change with its cost and time impact.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="change-order-title">
              {t("changeOrder:form.title", "Title")}
            </Label>
            <Input
              id="change-order-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="change-order-description">
              {t("changeOrder:form.descriptionLabel", "Description")}
            </Label>
            <Textarea
              id="change-order-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[6rem] resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="change-order-cost-impact">
                {t("changeOrder:form.costImpact", "Cost impact")}
              </Label>
              <Input
                id="change-order-cost-impact"
                type="number"
                min="0"
                step="0.01"
                value={costImpact}
                onChange={(event) => setCostImpact(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="change-order-hours-impact">
                {t("changeOrder:form.hoursImpact", "Hours impact")}
              </Label>
              <Input
                id="change-order-hours-impact"
                type="number"
                min="0"
                step="1"
                value={hoursImpact}
                onChange={(event) => setHoursImpact(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common:cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t("changeOrder:form.create", "Create change order")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
