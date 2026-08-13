import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

export type ChangeOrderStatus = "pending_review" | "approved" | "rejected";

const statusBadgeClassName: Record<ChangeOrderStatus, string> = {
  pending_review: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

export default function ChangeOrderStatusBadge({
  status,
}: {
  status: ChangeOrderStatus;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-0.5 font-medium text-xs",
        statusBadgeClassName[status],
      )}
    >
      {t(`changeOrder:status.${status}`)}
    </span>
  );
}
