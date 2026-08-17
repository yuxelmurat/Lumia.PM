# Workspace Dashboard — Design

Date: 2026-08-17
Scope: workspace-level dashboard only. Project-level dashboard is a separate, later spec.

## Problem

The app has no overview page. Workspace root (`/dashboard/workspace/$workspaceId`) currently
renders the project list directly. Users have no single place to see task status distribution,
overdue tasks, per-project progress, and recent activity across the whole workspace.

## Goals

- New workspace dashboard becomes the workspace landing page.
- Existing project list moves to its own route, unchanged in behavior.
- Four widgets: task status summary, overdue tasks, project progress cards, recent activity feed.
- No new realtime wiring (matches the existing Workload page precedent) — plain React Query
  fetch/refetch is enough for an overview page that isn't part of the primary work loop.

## Non-goals

- Project-level dashboard (separate spec, done later).
- Realtime push updates for dashboard widgets.
- Configurable/customizable widget layout.
- Historical trend charts (burndown, velocity, etc.) — only current-state snapshots.

## Backend

New module `apps/api/src/dashboard/`, following the `workload/` module pattern:

- `index.ts`: `GET /:workspaceId`, `workspaceAccess.fromParam()` +
  `requireWorkspacePermission({ task: ["read"] })`.
- `controllers/get-dashboard-summary.ts`: one function, three aggregations against
  non-archived projects in the workspace:

```ts
type DashboardSummary = {
  statusCounts: { status: string; count: number }[];
  overdueTasks: {
    id: string;
    number: number;
    title: string;
    projectId: string;
    projectName: string;
    dueDate: string;
    assigneeName: string | null;
  }[];
  recentActivity: {
    id: string;
    type: string;
    content: string | null;
    createdAt: string;
    userName: string | null;
    taskId: string;
    taskTitle: string;
    projectName: string;
  }[];
};
```

- `statusCounts`: group by `taskTable.status` across all non-archived-project tasks in the
  workspace. Unknown/custom status strings pass through as-is; the client maps known ones to
  `DEFAULT_COLUMNS` labels/icons and falls back to the raw string otherwise.
- `overdueTasks`: `taskTable.dueDate < now` and `columnTable.isFinal = false` (not the raw
  status string), same convention as `workload`'s open-task filter — this stays correct for
  projects with custom column names. Ordered by `dueDate` ascending, limited to 10.
- `recentActivity`: `activityTable` joined through `taskTable` → `projectTable`, filtered by
  `workspaceId` and non-archived projects, ordered by `createdAt` descending, limited to 15.
- Project progress cards do **not** get a new endpoint — reuse the existing
  `GET /project?workspaceId=` response, which already returns
  `statistics.completionPercentage` / `totalTasks` / `dueDate` per project
  (`apps/api/src/project/controllers/get-projects.ts`), and the existing
  `useGetProjects` web hook.

OpenAPI metadata and Valibot schemas follow the `workload` module's style.

## Frontend routing

- Move the current `dashboard/workspace/$workspaceId/index.tsx` (project list — table, reorder,
  create-project modal) to `dashboard/workspace/$workspaceId/projects.tsx`. Only the
  `createFileRoute` path string changes, to `/dashboard/workspace/$workspaceId/projects`;
  component logic is untouched.
- New `dashboard/workspace/$workspaceId/index.tsx` renders the Dashboard view and becomes the
  workspace landing page (root path).
- `components/nav-main.tsx`: add a "Dashboard" item as the first entry, pointing at the
  workspace root path with exact-match `isActive`. The existing "Projects" item's `url` changes
  to the new `/projects` path; its label and position (after Dashboard) stay the same.
- The ~17 existing call sites that navigate to `/dashboard/workspace/$workspaceId` (post-login
  redirect, workspace switcher, invitation acceptance, breadcrumbs, command palette, etc.) are
  unchanged — they now land on the new Dashboard by construction, which is the intended
  behavior change.
- New fetcher `fetchers/dashboard/get-dashboard-summary.ts` and query hook
  `hooks/queries/dashboard/use-dashboard-summary.ts`, using the `@kaneo/libs` typed client,
  following the existing fetcher/hook pattern (see `use-get-projects` / workload's hook).

## Widget UI

`components/dashboard/` — four components composed inside `WorkspaceLayout` in a grid on the
new index route:

- **StatusSummary** — `statusCounts` rendered as compact count tiles using `DEFAULT_COLUMNS`
  icon/label where the status matches a known default column id, raw string fallback otherwise.
- **OverdueTasksList** — list of overdue tasks: title, project name, assignee, days overdue.
  Row click navigates to the task detail. Empty state when there are no overdue tasks.
- **ProjectProgressCards** — reuses `useGetProjects`; renders project cards (name, progress
  bar, percentage, task count, due date). Card click navigates to that project's board.
- **RecentActivityFeed** — `recentActivity` list: user name, activity content, task/project
  name, relative timestamp (existing `formatDate*` helpers). Row click navigates to the task.

Loading and empty states follow the existing patterns used on the Workload and project-list
pages (`Skeleton`, `Empty*` components).

## i18n

New `dashboard` namespace in `i18n/en-US.json` for widget copy. `navigation:sidebar.dashboard`
key added; existing `navigation:sidebar.projects` key is kept as-is for the renamed nav item.

## Testing

- API: focused unit test for `get-dashboard-summary` covering status grouping, overdue
  filtering (including the `isFinal` column edge case), and activity join/limit/ordering.
  Integration test for the route's permission gate (`task: ["read"]`) and response shape.
- Web: component tests for the four widgets covering empty and populated states; a route test
  confirming the workspace root now mounts the Dashboard component and `/projects` mounts the
  former index content.
- Manual: run the app, verify workspace root shows the dashboard, `/projects` still lists/
  reorders projects correctly, and all pre-existing "go to workspace" navigations land on the
  new dashboard.
