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
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ProjectLayout from "@/components/common/project-layout";
import TaskFilterToolbar from "@/components/common/task-filter-toolbar";
import PageTitle from "@/components/page-title";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import { Button } from "@/components/ui/button";
import useGetLabelsByWorkspace from "@/hooks/queries/label/use-get-labels-by-workspace";
import { useGetTasks } from "@/hooks/queries/task/use-get-tasks";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import { useHeaderSearch } from "@/hooks/use-header-search";
import { useTaskFilterState } from "@/hooks/use-task-filter-state";
import { cn } from "@/lib/cn";
import {
  dueDateStatusBarColors,
  getDueDateStatus,
  isTaskCompleted,
} from "@/lib/due-date-status";
import { getPriorityIcon } from "@/lib/priority";
import { taskMatchesFilters } from "@/lib/task-filter-predicate";
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
  const { data: users } = useGetActiveWorkspaceUsers(workspaceId);
  const { data: workspaceLabels = [] } = useGetLabelsByWorkspace(workspaceId);
  const weekStartsOn = useUserPreferencesStore((state) => state.weekStartsOn);
  const { query: searchQuery, searchNode: calendarHeaderSearch } =
    useHeaderSearch(t("tasks:calendar.searchPlaceholder"));
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const {
    filters,
    updateFilter,
    updateLabelFilter,
    hasActiveFilters,
    clearFilters,
  } = useTaskFilterState(
    projectId ? `kaneo:calendar-filters:${projectId}` : null,
  );

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
    return datedTasks.filter((task) =>
      taskMatchesFilters(task, filters, {
        weekStartsOn,
        textQuery: searchQuery,
        projectSlug: project?.slug,
      }),
    );
  }, [datedTasks, filters, weekStartsOn, searchQuery, project?.slug]);

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
      headerActions={calendarHeaderSearch}
    >
      <PageTitle
        title={t("tasks:calendar.pageTitle", { name: project?.name })}
        hideAppName
      />
      <div className="flex h-full min-h-0 flex-col bg-background">
        <TaskFilterToolbar
          subjects={["status", "priority", "assignee", "dueDate", "labels"]}
          project={project}
          filters={filters}
          updateFilter={updateFilter}
          updateLabelFilter={updateLabelFilter}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          users={users}
          workspaceLabels={workspaceLabels}
          trailingActions={
            <>
              <span className="px-1 text-xs text-muted-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="xs"
                className="h-7"
                onClick={() =>
                  setCurrentMonth((current) => subMonths(current, 1))
                }
              >
                {"<"}
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="h-7"
                onClick={() => setCurrentMonth(new Date())}
              >
                {t("tasks:calendar.today")}
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="h-7"
                onClick={() =>
                  setCurrentMonth((current) => addMonths(current, 1))
                }
              >
                {">"}
              </Button>
            </>
          }
        />

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
                      {visibleDayTasks.map((task) => {
                        const isCompleted = isTaskCompleted(
                          task.status,
                          project?.columns,
                        );
                        const dueDateStatus = getDueDateStatus(
                          task.dueDate,
                          isCompleted,
                        );
                        const tint = dueDateStatusBarColors[dueDateStatus];

                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => openTask(task.id)}
                            className={cn(
                              "flex items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight text-foreground transition-colors hover:brightness-95",
                              tint.border,
                              tint.overlay,
                              isSameDay(task.calendarDate, day) &&
                                !isSameMonth(day, currentMonth) &&
                                "opacity-70",
                            )}
                          >
                            <span className="shrink-0 [&>svg]:h-2.5 [&>svg]:w-2.5">
                              {getPriorityIcon(task.priority ?? "")}
                            </span>
                            <span className="truncate">{task.title}</span>
                          </button>
                        );
                      })}

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
