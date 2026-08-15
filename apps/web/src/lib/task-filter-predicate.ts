import { addWeeks, endOfWeek, isWithinInterval, startOfWeek } from "date-fns";
import {
  type BoardFilters,
  DUE_DATE_FILTER_VALUES,
} from "@/hooks/use-task-filters";
import type Task from "@/types/task";

type MatchOptions = {
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  textQuery?: string;
  projectSlug?: string;
};

/**
 * Shared predicate for the status/priority/assignee/due-date/label/text
 * filtering used by every task-list view (board, backlog, gantt, calendar).
 * Keeping this in one place is what lets the four views share one filter
 * vocabulary instead of drifting into subtly different matching rules.
 */
export function taskMatchesFilters(
  task: Task,
  filters: BoardFilters,
  options: MatchOptions,
): boolean {
  const normalizedTextQuery = options.textQuery?.trim().toLowerCase();

  if (normalizedTextQuery) {
    const title = task.title?.toLowerCase() ?? "";
    const description = task.description?.toLowerCase() ?? "";
    const taskNumber = task.number?.toString() ?? "";
    const taskIdentifier =
      taskNumber && options.projectSlug
        ? `${options.projectSlug}-${taskNumber}`.toLowerCase()
        : "";
    const taskShortIdentifier = taskNumber ? `#${taskNumber}` : "";
    const matchesText =
      title.includes(normalizedTextQuery) ||
      description.includes(normalizedTextQuery) ||
      taskNumber.includes(normalizedTextQuery) ||
      taskIdentifier.startsWith(normalizedTextQuery) ||
      taskShortIdentifier.startsWith(normalizedTextQuery);

    if (!matchesText) return false;
  }

  if (
    filters.status &&
    filters.status.length > 0 &&
    !filters.status.includes(task.status)
  ) {
    return false;
  }

  if (
    filters.priority &&
    filters.priority.length > 0 &&
    !filters.priority.includes(task.priority ?? "")
  ) {
    return false;
  }

  if (
    filters.assignee &&
    filters.assignee.length > 0 &&
    !filters.assignee.includes(task.userId ?? "")
  ) {
    return false;
  }

  if (filters.dueDate && filters.dueDate.length > 0) {
    const today = new Date();
    const taskDate = task.dueDate ? new Date(task.dueDate) : null;

    const matchesAnyDueDate = filters.dueDate.some((dueDateFilter) => {
      if (dueDateFilter === DUE_DATE_FILTER_VALUES.noDueDate) {
        return !task.dueDate;
      }

      if (!taskDate) return false;

      switch (dueDateFilter) {
        case DUE_DATE_FILTER_VALUES.dueThisWeek: {
          const weekStart = startOfWeek(today, {
            weekStartsOn: options.weekStartsOn,
          });
          const weekEnd = endOfWeek(today, {
            weekStartsOn: options.weekStartsOn,
          });
          return isWithinInterval(taskDate, {
            start: weekStart,
            end: weekEnd,
          });
        }
        case DUE_DATE_FILTER_VALUES.dueNextWeek: {
          const nextWeekStart = startOfWeek(addWeeks(today, 1), {
            weekStartsOn: options.weekStartsOn,
          });
          const nextWeekEnd = endOfWeek(addWeeks(today, 1), {
            weekStartsOn: options.weekStartsOn,
          });
          return isWithinInterval(taskDate, {
            start: nextWeekStart,
            end: nextWeekEnd,
          });
        }
        default:
          return false;
      }
    });

    if (!matchesAnyDueDate) return false;
  }

  if (filters.labels && filters.labels.length > 0) {
    const taskLabelIds = (task.labels ?? []).map((label) => label.id);
    const hasMatchingLabel = filters.labels.some((labelId) =>
      taskLabelIds.includes(labelId),
    );
    if (!hasMatchingLabel) return false;
  }

  return true;
}
