import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

export type SubmittalStatus =
  | "open"
  | "approved"
  | "revise_resubmit"
  | "closed";

const statusBadgeClassName: Record<SubmittalStatus, string> = {
  open: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  revise_resubmit: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  closed: "bg-muted text-muted-foreground",
};

export default function SubmittalStatusBadge({
  status,
}: {
  status: SubmittalStatus;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-0.5 font-medium text-xs",
        statusBadgeClassName[status],
      )}
    >
      {t(`submittal:status.${status}`)}
    </span>
  );
}
