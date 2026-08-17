import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

export type RfiStatus = "open" | "answered" | "closed";

const statusBadgeClassName: Record<RfiStatus, string> = {
  open: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  answered: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  closed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export default function RfiStatusBadge({ status }: { status: RfiStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-0.5 font-medium text-xs",
        statusBadgeClassName[status],
      )}
    >
      {t(`rfi:status.${status}`)}
    </span>
  );
}
