import { CheckCircle2, MessageCircleWarning } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/preview-card";

type TaskApprovalBadgeProps = {
  approvalStatus?: string | null;
  approvalClientName?: string | null;
};

export function TaskApprovalBadge({
  approvalStatus,
  approvalClientName,
}: TaskApprovalBadgeProps) {
  const { t } = useTranslation();

  if (!approvalStatus) return null;

  const badge =
    approvalStatus === "approved" ? (
      <Badge
        variant="success"
        className="gap-1 px-2 py-0.5 text-[10px] font-medium"
      >
        <CheckCircle2 className="w-3 h-3" />
        {t("publicProject:approval.statusApproved")}
      </Badge>
    ) : (
      <Badge
        variant="warning"
        className="gap-1 px-2 py-0.5 text-[10px] font-medium"
      >
        <MessageCircleWarning className="w-3 h-3" />
        {t("publicProject:approval.statusChangesRequested")}
      </Badge>
    );

  if (!approvalClientName) {
    return badge;
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{badge}</HoverCardTrigger>
      <HoverCardContent className="w-auto p-2" side="bottom">
        <p className="text-xs text-muted-foreground">
          {t("publicProject:approval.respondedAs", {
            name: approvalClientName,
          })}
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
