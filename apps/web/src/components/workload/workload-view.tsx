import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetWorkload } from "@/hooks/queries/workload/use-get-workload";
import { cn } from "@/lib/cn";

const WEEKLY_CAPACITY_HOURS = 40;

type WorkloadViewProps = {
  workspaceId: string;
};

export default function WorkloadView({ workspaceId }: WorkloadViewProps) {
  const { t } = useTranslation();
  const { data: rows = [], isLoading } = useGetWorkload(workspaceId);

  const weeks = rows[0]?.weeks ?? [];

  if (isLoading) return null;

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-sm text-center">
          <h2 className="text-sm font-semibold text-foreground">
            {t("workload:empty", "No upcoming workload")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              "workload:emptySubtitle",
              "Assign tasks with a due date and estimated hours to see capacity here.",
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("workload:member", "Member")}</TableHead>
            {weeks.map((week) => (
              <TableHead key={week.weekStart} className="text-right">
                {new Date(week.weekStart).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.userId}>
              <TableCell className="font-medium text-foreground">
                {row.userName ?? t("workload:unknownMember", "Unknown")}
              </TableCell>
              {row.weeks.map((week) => (
                <TableCell
                  key={week.weekStart}
                  className={cn(
                    "text-right tabular-nums",
                    week.totalHours > WEEKLY_CAPACITY_HOURS
                      ? "font-semibold text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {week.totalHours}h
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
