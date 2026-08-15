import { useCallback, useMemo } from "react";
import { taskMatchesFilters } from "@/lib/task-filter-predicate";
import { useUserPreferencesStore } from "@/store/user-preferences";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";
import { useTaskFilterState } from "./use-task-filter-state";

export function useTaskFiltersWithLabelsSupport(
  project: ProjectWithTasks | null | undefined,
  projectId?: string,
  textQuery?: string,
) {
  const weekStartsOn = useUserPreferencesStore((state) => state.weekStartsOn);
  const storageKey = projectId ? `kaneo:board-filters:${projectId}` : null;
  const {
    filters,
    setFilters,
    updateFilter,
    updateLabelFilter,
    hasActiveFilters,
    clearFilters,
  } = useTaskFilterState(storageKey);

  const filterTasks = useCallback(
    (tasks: Task[]): Task[] =>
      tasks.filter((task) =>
        taskMatchesFilters(task, filters, {
          weekStartsOn,
          textQuery,
          projectSlug: project?.slug,
        }),
      ),
    [filters, project?.slug, textQuery, weekStartsOn],
  );

  const filteredProject = useMemo(() => {
    if (!project) return null;

    return {
      ...project,
      columns:
        project.columns?.map((column) => ({
          ...column,
          tasks: filterTasks(column.tasks),
        })) ?? [],
    };
  }, [project, filterTasks]);

  return {
    filters,
    setFilters,
    updateFilter,
    updateLabelFilter,
    filteredProject,
    hasActiveFilters,
    clearFilters,
  };
}
