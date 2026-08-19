import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_COLUMNS } from "@/constants/columns";
import { getStatusLabel } from "@/lib/i18n/domain";

type StatusCount = { status: string; count: number };

function StatusIcon({ status }: { status: string }) {
  const Icon = DEFAULT_COLUMNS.find((column) => column.id === status)?.icon;
  if (!Icon) return null;
  return <Icon className="h-4 w-4 text-muted-foreground" />;
}

export function StatusSummary({
  statusCounts,
  isLoading,
}: {
  statusCounts: StatusCount[] | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const rows = statusCounts ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard:statusSummary.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-24" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard:statusSummary.empty")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {rows.map((row) => (
              <div
                key={row.status}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <StatusIcon status={row.status} />
                <div>
                  <div className="text-lg font-semibold leading-none">
                    {row.count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getStatusLabel(row.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
