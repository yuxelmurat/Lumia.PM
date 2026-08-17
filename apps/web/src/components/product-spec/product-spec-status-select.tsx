import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

export type ProductSpecStatus =
  | "proposed"
  | "client_approved"
  | "ordered"
  | "received"
  | "installed";

const statuses: ProductSpecStatus[] = [
  "proposed",
  "client_approved",
  "ordered",
  "received",
  "installed",
];

const statusBadgeClassName: Record<ProductSpecStatus, string> = {
  client_approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  installed: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  ordered: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  proposed: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  received: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
};

export function ProductSpecStatusBadge({
  status,
}: {
  status: ProductSpecStatus;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-0.5 font-medium text-xs",
        statusBadgeClassName[status],
      )}
    >
      {t(`productSpec:status.${status}`)}
    </span>
  );
}

type ProductSpecStatusSelectProps = {
  value: ProductSpecStatus;
  onChange: (status: ProductSpecStatus) => void;
  disabled?: boolean;
};

export default function ProductSpecStatusSelect({
  value,
  onChange,
  disabled,
}: ProductSpecStatusSelectProps) {
  const { t } = useTranslation();

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as ProductSpecStatus)}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24 disabled:opacity-64"
    >
      {statuses.map((status) => (
        <option key={status} value={status}>
          {t(`productSpec:status.${status}`)}
        </option>
      ))}
    </select>
  );
}
