import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ProjectLayout from "@/components/common/project-layout";
import PageTitle from "@/components/page-title";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetTasks } from "@/hooks/queries/task/use-get-tasks";
import { cn } from "@/lib/cn";
import { useUserPreferencesStore } from "@/store/user-preferences";

const MAX_VISIBLE_TASKS_PER_DAY = 3;

type CalendarSearchParams = {
  taskId?: string;
};

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/calendar",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): CalendarSearchParams => ({
    taskId: typeof search.taskId === "string" ? search.taskId : undefined,
  }),
});

function parseTaskDate(value: string | null) {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function RouteComponent() {
  const { t } = useTranslation();
  const { projectId, workspaceId } = Route.useParams();
  const { taskId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: project } = useGetTasks(projectId);
  const weekStartsOn = useUserPreferencesStore((state) => state.weekStartsOn);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const allTasks = useMemo(
    () => [
      ...(project?.columns.flatMap((column) => column.tasks) ?? []),
      ...(project?.plannedTasks ?? []),
    ],
    [project],
  );

  const datedTasks = useMemo(() => {
    return allTasks
      .map((task) => {
        const calendarDate =
          parseTaskDate(task.dueDate) ?? parseTaskDate(task.startDate);
        if (!calendarDate) return null;

        return {
          ...task,
          calendarDate,
        };
      })
      .filter((task): task is NonNullable<typeof task> => task !== null);
  }, [allTasks]);

  const visibleTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return datedTasks;

    return datedTasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(normalizedQuery) ||
        `${project?.slug ?? ""}-${task.number ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery) ||
        task.status.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [datedTasks, project?.slug, searchQuery]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const rangeStart = startOfWeek(monthStart, { weekStartsOn });
    const rangeEnd = endOfWeek(monthEnd, { weekStartsOn });

    return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  }, [currentMonth, weekStartsOn]);

  const weekdayLabels = useMemo(() => {
    return calendarDays.slice(0, 7).map((day) => format(day, "EEE"));
  }, [calendarDays]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof visibleTasks>();
    for (const day of calendarDays) {
      map.set(format(day, "yyyy-MM-dd"), []);
    }
    for (const task of visibleTasks) {
      const key = format(task.calendarDate, "yyyy-MM-dd");
      const existing = map.get(key);
      if (existing) {
        existing.push(task);
      }
    }
    return map;
  }, [calendarDays, visibleTasks]);

  const openTask = (id: string) => {
    navigate({
      to: ".",
      search: { taskId: id },
      replace: true,
    });
  };

  return (
    <ProjectLayout
      projectId={projectId}
      workspaceId={workspaceId}
      activeView="calendar"
    >
      <PageTitle
        title={t("tasks:calendar.pageTitle", { name: project?.name })}
        hideAppName
      />
      <div className="flex h-full min-h-0 flex-col bg-background">
        <div className="border-b border-border/80 px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground">
                {t("tasks:calendar.title")}
              </h1>
              <span className="text-sm text-muted-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("tasks:calendar.searchPlaceholder")}
                  className="h-9 min-h-11 touch-manipulation sm:h-8 sm:min-h-0 [&_[data-slot=input]]:pl-8 [&_[data-slot=input]]:text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="xs"
                  className="h-8"
                  onClick={() =>
                    setCurrentMonth((current) => subMonths(current, 1))
                  }
                >
                  {"<"}
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="h-8"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  {t("tasks:calendar.today")}
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="h-8"
                  onClick={() =>
                    setCurrentMonth((current) => addMonths(current, 1))
                  }
                >
                  {">"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {datedTasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-sm text-center">
              <h2 className="text-sm font-semibold text-foreground">
                {t("tasks:calendar.noTasks")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("tasks:calendar.noTasksSubtitle")}
              </p>
            </div>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-sm text-center">
              <h2 className="text-sm font-semibold text-foreground">
                {t("tasks:calendar.noTasksFound")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("tasks:calendar.noTasksMatch", { query: searchQuery })}
              </p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="grid grid-cols-7 border-b border-border/70">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="border-r border-border/60 px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground last:border-r-0"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr">
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayTasks = tasksByDay.get(key) ?? [];
                const visibleDayTasks = dayTasks.slice(
                  0,
                  MAX_VISIBLE_TASKS_PER_DAY,
                );
                const hiddenCount = dayTasks.length - visibleDayTasks.length;

                return (
                  <div
                    key={key}
                    className={cn(
                      "flex min-h-24 flex-col gap-1 border-r border-b border-border/60 p-1.5 sm:min-h-28",
                      !isSameMonth(day, currentMonth) &&
                        "bg-muted/20 text-muted-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday(day) && "bg-primary text-primary-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </div>

                    <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                      {visibleDayTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => openTask(task.id)}
                          className={cn(
                            "truncate rounded-md border border-primary/25 bg-primary/12 px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight text-foreground transition-colors hover:bg-primary/18",
                            isSameDay(task.calendarDate, day) &&
                              !isSameMonth(day, currentMonth) &&
                              "opacity-70",
                          )}
                        >
                          {task.title}
                        </button>
                      ))}

                      {hiddenCount > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            openTask(
                              dayTasks[visibleDayTasks.length]?.id ??
                                dayTasks[0].id,
                            )
                          }
                          className="truncate px-1.5 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        >
                          {t("tasks:calendar.moreCount", {
                            count: hiddenCount,
                          })}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <TaskDetailsSheet
          taskId={taskId}
          projectId={projectId}
          workspaceId={workspaceId}
          onClose={() =>
            navigate({
              to: ".",
              search: {},
              replace: true,
            })
          }
        />
      </div>
    </ProjectLayout>
  );
}
