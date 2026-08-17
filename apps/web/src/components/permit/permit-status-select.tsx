import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

export type PermitStatus =
  | "not_submitted"
  | "submitted"
  | "corrections_required"
  | "approved"
  | "issued";

const statuses: PermitStatus[] = [
  "not_submitted",
  "submitted",
  "corrections_required",
  "approved",
  "issued",
];

const statusBadgeClassName: Record<PermitStatus, string> = {
  not_submitted: "bg-muted text-muted-foreground",
  submitted: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  corrections_required: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  approved: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  issued: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export function PermitStatusBadge({ status }: { status: PermitStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-0.5 font-medium text-xs",
        statusBadgeClassName[status],
      )}
    >
      {t(`permit:status.${status}`)}
    </span>
  );
}

type PermitStatusSelectProps = {
  value: PermitStatus;
  onChange: (status: PermitStatus) => void;
  disabled?: boolean;
};

export default function PermitStatusSelect({
  value,
  onChange,
  disabled,
}: PermitStatusSelectProps) {
  const { t } = useTranslation();

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as PermitStatus)}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24 disabled:opacity-64"
    >
      {statuses.map((status) => (
        <option key={status} value={status}>
          {t(`permit:status.${status}`)}
        </option>
      ))}
    </select>
  );
}
