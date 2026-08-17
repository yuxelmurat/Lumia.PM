# Workspace Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each workspace a landing-page dashboard (task status summary, overdue tasks, project progress cards, recent activity) backed by one new API endpoint, and move the existing project list off the workspace root onto its own `/projects` route.

**Architecture:** A new `apps/api/src/dashboard` Hono module (mirroring the existing `workload` module) aggregates three read-only queries — status counts, overdue tasks, recent activity — behind `GET /api/dashboard/:workspaceId`. The web app gets a typed fetcher/hook pair calling it, four presentational widget components, and a route swap: the current `.../$workspaceId/index.tsx` (project list) moves to `.../$workspaceId/projects.tsx` unchanged, and a new `.../$workspaceId/index.tsx` renders the dashboard. `nav-main.tsx` gets a new "Dashboard" sidebar entry.

**Tech Stack:** Hono + hono-openapi + valibot + drizzle-orm (API), React + TanStack Router/Query + react-i18next (web), vitest (API integration tests).

## Global Constraints

- Workspace-scoped reads go through `workspaceAccess.fromParam()` + `requireWorkspacePermission({ task: ["read"] })`, matching `apps/api/src/workload/index.ts`.
- "Overdue" and "open" task filtering uses `columnTable.isFinal`, not the raw `taskTable.status` string, so it stays correct for projects with custom column names (see `apps/api/src/workload/controllers/get-workload.ts`).
- No new realtime/WebSocket wiring — plain TanStack Query fetch on mount, matching the Workload page precedent.
- All new user-facing strings go in `i18n/en-US.json` (the source of truth) under a new `dashboard` namespace plus one `navigation:sidebar.dashboard` key.
- Project progress cards reuse the existing `GET /api/project?workspaceId=` response (`useGetProjects`) — no new endpoint for that widget.

---

## File Structure

**Backend (new):**
- `apps/api/src/dashboard/index.ts` — route definition, permission gate, OpenAPI schema.
- `apps/api/src/dashboard/controllers/get-dashboard-summary.ts` — the three aggregation queries.
- `tests/api-integration/dashboard.test.ts` — integration coverage.

**Backend (modified):**
- `apps/api/src/index.ts` — register the new module (import, route, return, destructure, `AppType` union), following the existing `workload` wiring exactly.

**Frontend (new):**
- `apps/web/src/fetchers/dashboard/get-dashboard-summary.ts`
- `apps/web/src/hooks/queries/dashboard/use-dashboard-summary.ts`
- `apps/web/src/components/dashboard/status-summary.tsx`
- `apps/web/src/components/dashboard/overdue-tasks-list.tsx`
- `apps/web/src/components/dashboard/project-progress-cards.tsx`
- `apps/web/src/components/dashboard/recent-activity-feed.tsx`
- `apps/web/src/routes/_layout/_authenticated/dashboard/workspace/$workspaceId/projects.tsx` (moved content)

**Frontend (modified):**
- `apps/web/src/routes/_layout/_authenticated/dashboard/workspace/$workspaceId/index.tsx` — replaced with the dashboard page.
- `apps/web/src/components/nav-main.tsx` — new "Dashboard" nav item, "Projects" item points at `/projects`.
- `i18n/en-US.json` — new `dashboard` namespace, new `navigation.sidebar.dashboard` key.

---

### Task 1: Backend — dashboard aggregation module

**Files:**
- Create: `apps/api/src/dashboard/controllers/get-dashboard-summary.ts`
- Create: `apps/api/src/dashboard/index.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Produces: `getDashboardSummary(workspaceId: string): Promise<DashboardSummary>` where
  ```ts
  type DashboardSummary = {
    statusCounts: { status: string; count: number }[];
    overdueTasks: {
      id: string;
      number: number;
      title: string;
      projectId: string;
      projectName: string;
      dueDate: Date;
      assigneeName: string | null;
    }[];
    recentActivity: {
      id: string;
      type: string;
      content: string | null;
      createdAt: Date;
      userName: string | null;
      taskId: string;
      taskTitle: string;
      projectId: string;
      projectName: string;
    }[];
  };
  ```
- Produces: default-exported Hono app `dashboard` mounted at `GET /:workspaceId`, registered under `/api/dashboard` — used by Task 2's tests and by the frontend fetcher in Task 3.

- [ ] **Step 1: Write `get-dashboard-summary.ts`**

```ts
import { and, asc, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import db from "../../database";
import {
  activityTable,
  columnTable,
  projectTable,
  taskTable,
  userTable,
} from "../../database/schema";

export type DashboardStatusCount = {
  status: string;
  count: number;
};

export type DashboardOverdueTask = {
  id: string;
  number: number;
  title: string;
  projectId: string;
  projectName: string;
  dueDate: Date;
  assigneeName: string | null;
};

export type DashboardActivityItem = {
  id: string;
  type: string;
  content: string | null;
  createdAt: Date;
  userName: string | null;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
};

export type DashboardSummary = {
  statusCounts: DashboardStatusCount[];
  overdueTasks: DashboardOverdueTask[];
  recentActivity: DashboardActivityItem[];
};

const OVERDUE_LIMIT = 10;
const ACTIVITY_LIMIT = 15;

async function getStatusCounts(
  workspaceId: string,
): Promise<DashboardStatusCount[]> {
  const rows = await db
    .select({
      status: taskTable.status,
      count: sql<number>`count(*)`,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        isNull(projectTable.archivedAt),
      ),
    )
    .groupBy(taskTable.status);

  return rows.map((row) => ({
    status: row.status,
    count: Number(row.count),
  }));
}

async function getOverdueTasks(
  workspaceId: string,
  now: Date,
): Promise<DashboardOverdueTask[]> {
  const rows = await db
    .select({
      id: taskTable.id,
      number: taskTable.number,
      title: taskTable.title,
      dueDate: taskTable.dueDate,
      projectId: projectTable.id,
      projectName: projectTable.name,
      assigneeName: userTable.name,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .leftJoin(columnTable, eq(taskTable.columnId, columnTable.id))
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        isNull(projectTable.archivedAt),
        lt(taskTable.dueDate, now),
        or(isNull(columnTable.isFinal), eq(columnTable.isFinal, false)),
      ),
    )
    .orderBy(asc(taskTable.dueDate))
    .limit(OVERDUE_LIMIT);

  return rows
    .filter(
      (row): row is typeof row & { dueDate: Date } => row.dueDate !== null,
    )
    .map((row) => ({
      id: row.id,
      number: row.number ?? 0,
      title: row.title,
      projectId: row.projectId,
      projectName: row.projectName,
      dueDate: row.dueDate,
      assigneeName: row.assigneeName,
    }));
}

async function getRecentActivity(
  workspaceId: string,
): Promise<DashboardActivityItem[]> {
  return db
    .select({
      id: activityTable.id,
      type: activityTable.type,
      content: activityTable.content,
      createdAt: activityTable.createdAt,
      userName: userTable.name,
      taskId: taskTable.id,
      taskTitle: taskTable.title,
      projectId: projectTable.id,
      projectName: projectTable.name,
    })
    .from(activityTable)
    .innerJoin(taskTable, eq(activityTable.taskId, taskTable.id))
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .leftJoin(userTable, eq(activityTable.userId, userTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        isNull(projectTable.archivedAt),
      ),
    )
    .orderBy(desc(activityTable.createdAt))
    .limit(ACTIVITY_LIMIT);
}

async function getDashboardSummary(
  workspaceId: string,
): Promise<DashboardSummary> {
  const now = new Date();
  const [statusCounts, overdueTasks, recentActivity] = await Promise.all([
    getStatusCounts(workspaceId),
    getOverdueTasks(workspaceId, now),
    getRecentActivity(workspaceId),
  ]);

  return { statusCounts, overdueTasks, recentActivity };
}

export default getDashboardSummary;
```

- [ ] **Step 2: Write `dashboard/index.ts`**

```ts
import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import getDashboardSummary from "./controllers/get-dashboard-summary";

const statusCountSchema = v.object({
  status: v.string(),
  count: v.number(),
});

const overdueTaskSchema = v.object({
  id: v.string(),
  number: v.number(),
  title: v.string(),
  projectId: v.string(),
  projectName: v.string(),
  dueDate: v.string(),
  assigneeName: v.nullable(v.string()),
});

const activityItemSchema = v.object({
  id: v.string(),
  type: v.string(),
  content: v.nullable(v.string()),
  createdAt: v.string(),
  userName: v.nullable(v.string()),
  taskId: v.string(),
  taskTitle: v.string(),
  projectId: v.string(),
  projectName: v.string(),
});

const dashboardSummarySchema = v.object({
  statusCounts: v.array(statusCountSchema),
  overdueTasks: v.array(overdueTaskSchema),
  recentActivity: v.array(activityItemSchema),
});

const dashboard = new Hono<{
  Variables: {
    userId: string;
  };
}>().get(
  "/:workspaceId",
  describeRoute({
    operationId: "getDashboardSummary",
    tags: ["Dashboard"],
    description:
      "Workspace-wide task status counts, overdue tasks, and recent activity for the dashboard overview",
    responses: {
      200: {
        description: "Dashboard summary",
        content: {
          "application/json": { schema: resolver(dashboardSummarySchema) },
        },
      },
    },
  }),
  validator("param", v.object({ workspaceId: v.string() })),
  workspaceAccess.fromParam(),
  requireWorkspacePermission({ task: ["read"] }),
  async (c) => {
    const { workspaceId } = c.req.valid("param");
    const summary = await getDashboardSummary(workspaceId);
    return c.json(summary);
  },
);

export default dashboard;
```

- [ ] **Step 3: Wire the module into `apps/api/src/index.ts`**

Add the import next to the `workload` import (around line 101):

```ts
import dashboard from "./dashboard";
import workload from "./workload";
```

Add the route registration next to `workloadApi` (around line 704):

```ts
  const dashboardApi = api.route("/dashboard", dashboard);
  const workloadApi = api.route("/workload", workload);
```

Add `dashboardApi,` to the `createApp` return object next to `workloadApi,` (around line 888), to the `createdApp` destructure next to `workloadApi,` (around line 1025), and add `| typeof dashboardApi` to the `AppType` union next to `| typeof workloadApi` (around line 1089).

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @kaneo/api typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/dashboard apps/api/src/index.ts
git commit -m "feat: add workspace dashboard summary endpoint"
```

---

### Task 2: Backend — integration tests

**Files:**
- Create: `tests/api-integration/dashboard.test.ts`

**Interfaces:**
- Consumes: `GET /api/dashboard/:workspaceId` from Task 1, response shape `DashboardSummary` (JSON-serialized: `dueDate`/`createdAt` are ISO strings over the wire).
- Consumes test helpers: `createWorkspaceMember`, `createProjectFixture` from `tests/api-integration/helpers/fixtures.ts` (columns keyed `todo`/`inProgress`/`inReview`/`done`, `done.isFinal === true`); `mockAuthenticatedSession` from `helpers/auth`; `resetTestDatabase` from `helpers/database`.

- [ ] **Step 1: Write the test file**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

let taskNumberCounter = 0;

async function createTaskFixture({
  projectId,
  userId,
  columnId,
  status,
  dueDate,
}: {
  projectId: string;
  userId: string | null;
  columnId: string;
  status: string;
  dueDate: Date | null;
}) {
  taskNumberCounter += 1;
  const [task] = await db
    .insert(schema.taskTable)
    .values({
      projectId,
      userId,
      title: `Dashboard test task ${taskNumberCounter}`,
      status,
      columnId,
      priority: "medium",
      number: taskNumberCounter,
      position: 1,
      dueDate,
    })
    .returning();

  if (!task) {
    throw new Error("Failed to seed task fixture");
  }
  return task;
}

describe("API integration: Dashboard", () => {
  beforeEach(async () => {
    await resetTestDatabase();
    taskNumberCounter = 0;
  });

  it("returns status counts, overdue tasks, and recent activity for the workspace", async () => {
    const member = await createWorkspaceMember();
    const { project, columns } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const overdueTask = await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.todo.id,
      status: "to-do",
      dueDate: yesterday,
    });
    await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.inProgress.id,
      status: "in-progress",
      dueDate: nextWeek,
    });
    // Overdue by due date but sitting in a final column: must not count as overdue.
    await createTaskFixture({
      projectId: project.id,
      userId: member.user.id,
      columnId: columns.done.id,
      status: "done",
      dueDate: yesterday,
    });

    await db.insert(schema.activityTable).values({
      taskId: overdueTask.id,
      type: "status_updated",
      content: "moved to In Progress",
      userId: member.user.id,
    });

    mockAuthenticatedSession(member.user);
    const { app } = createApp();

    const response = await app.request(
      `/api/dashboard/${member.workspace.id}`,
    );
    expect(response.status).toBe(200);

    const summary = (await response.json()) as {
      statusCounts: Array<{ status: string; count: number }>;
      overdueTasks: Array<{ id: string; projectName: string }>;
      recentActivity: Array<{
        id: string;
        taskId: string;
        projectId: string;
        projectName: string;
      }>;
    };

    const toDoCount = summary.statusCounts.find((s) => s.status === "to-do");
    expect(toDoCount?.count).toBe(1);
    const doneCount = summary.statusCounts.find((s) => s.status === "done");
    expect(doneCount?.count).toBe(1);

    expect(summary.overdueTasks).toHaveLength(1);
    expect(summary.overdueTasks[0]?.id).toBe(overdueTask.id);
    expect(summary.overdueTasks[0]?.projectName).toBe(project.name);

    expect(summary.recentActivity).toHaveLength(1);
    expect(summary.recentActivity[0]?.taskId).toBe(overdueTask.id);
    expect(summary.recentActivity[0]?.projectId).toBe(project.id);
    expect(summary.recentActivity[0]?.projectName).toBe(project.name);
  });

  it("rejects unauthorized workspace access", async () => {
    const member = await createWorkspaceMember();
    const outsider = await createWorkspaceMember();

    mockAuthenticatedSession(outsider.user);
    const { app } = createApp();

    const response = await app.request(
      `/api/dashboard/${member.workspace.id}`,
    );
    expect(response.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `pnpm --filter @kaneo/api test:integration -- dashboard`
Expected: both tests pass (`2 passed`).

- [ ] **Step 3: Commit**

```bash
git add tests/api-integration/dashboard.test.ts
git commit -m "test: cover workspace dashboard summary endpoint"
```

---

### Task 3: Frontend — fetcher and query hook

**Files:**
- Create: `apps/web/src/fetchers/dashboard/get-dashboard-summary.ts`
- Create: `apps/web/src/hooks/queries/dashboard/use-dashboard-summary.ts`

**Interfaces:**
- Consumes: `client.dashboard[":workspaceId"].$get` from `@kaneo/libs`, typed against the `AppType` union updated in Task 1.
- Produces: `useDashboardSummary(workspaceId: string | undefined)` — a `useQuery` result whose `data` is the `DashboardSummary` JSON shape (dates as ISO strings) — consumed by Task 6's route component.

- [ ] **Step 1: Write the fetcher**

```ts
import { client } from "@kaneo/libs";

async function getDashboardSummary(workspaceId: string) {
  const response = await client.dashboard[":workspaceId"].$get({
    param: { workspaceId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getDashboardSummary;
```

- [ ] **Step 2: Write the hook**

```ts
import { useQuery } from "@tanstack/react-query";
import getDashboardSummary from "@/fetchers/dashboard/get-dashboard-summary";

export function useDashboardSummary(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-summary", workspaceId],
    queryFn: () => getDashboardSummary(workspaceId as string),
    enabled: !!workspaceId,
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @kaneo/web typecheck`
Expected: no errors (confirms `client.dashboard` resolves against the updated `AppType`).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/fetchers/dashboard apps/web/src/hooks/queries/dashboard
git commit -m "feat: add dashboard summary fetcher and query hook"
```

---

### Task 4: Frontend — routing swap and navigation

**Files:**
- Create: `apps/web/src/routes/_layout/_authenticated/dashboard/workspace/$workspaceId/projects.tsx`
- Modify: `apps/web/src/routes/_layout/_authenticated/dashboard/workspace/$workspaceId/index.tsx` (fully replaced in Task 6 — this task only removes it here so the route isn't duplicated)
- Modify: `apps/web/src/components/nav-main.tsx`
- Modify: `i18n/en-US.json`

**Interfaces:**
- Produces: route `/dashboard/workspace/$workspaceId/projects` serving the existing project list UI — used by Task 6 indirectly (Dashboard doesn't link to it directly, but nav does) and by the nav item added here.

- [ ] **Step 1: Create `projects.tsx` with the current project-list content**

Copy the full current contents of `apps/web/src/routes/_layout/_authenticated/dashboard/workspace/$workspaceId/index.tsx` into the new file, changing only the route path on the `createFileRoute` call:

```ts
export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/projects",
)({
  component: RouteComponent,
});
```

(Every other line — imports, `SortableProjectRow`, `RouteComponent`, drag-and-drop handling, table markup — is copied verbatim from the existing file.)

- [ ] **Step 2: Delete the old route file's content (it will be replaced in Task 6)**

Run: `rm "apps/web/src/routes/_layout/_authenticated/dashboard/workspace/\$workspaceId/index.tsx"`

(Task 6 recreates this path with the dashboard component. Removing it now avoids two components claiming the same route path in between tasks — if you're executing tasks out of order, do Task 6 immediately after this step.)

- [ ] **Step 3: Add the `dashboard` sidebar key and rename the nav item's target**

In `i18n/en-US.json`, inside `navigation.sidebar` (around line 1450), add `"dashboard"` before `"projects"`:

```json
			"sidebar": {
				"overview": "Overview",
				"dashboard": "Dashboard",
				"projects": "Projects",
				"members": "Members",
				"workload": "Workload",
				"invitations": "Invitations",
				"more": "More",
				"backToBoard": "Back to board"
			},
```

- [ ] **Step 4: Update `nav-main.tsx`**

Replace the `navItems` array:

```tsx
  const navItems = [
    {
      title: t("navigation:sidebar.dashboard"),
      url: `/dashboard/workspace/${workspace.id}`,
      isActive:
        window.location.pathname === `/dashboard/workspace/${workspace.id}`,
      badge: null,
    },
    {
      title: t("navigation:sidebar.projects"),
      url: `/dashboard/workspace/${workspace.id}/projects`,
      isActive:
        window.location.pathname ===
        `/dashboard/workspace/${workspace.id}/projects`,
      badge: null,
    },
    {
      title: t("navigation:sidebar.members"),
      url: `/dashboard/workspace/${workspace.id}/members`,
      isActive:
        window.location.pathname ===
        `/dashboard/workspace/${workspace.id}/members`,
      badge: null,
    },
    {
      title: t("navigation:sidebar.workload"),
      url: `/dashboard/workspace/${workspace.id}/workload`,
      isActive:
        window.location.pathname ===
        `/dashboard/workspace/${workspace.id}/workload`,
      badge: null,
    },
    {
      title: t("navigation:sidebar.invitations"),
      url: "/dashboard/invitations",
      isActive: window.location.pathname === "/dashboard/invitations",
      badge: pendingCount > 0 ? pendingCount : null,
    },
  ];
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @kaneo/web typecheck`
Expected: no errors from `nav-main.tsx` or `projects.tsx`. (The now-empty `index.tsx` route will error until Task 6 recreates it — if running tasks in order, proceed directly to Task 6 before typechecking.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/_layout/_authenticated/dashboard/workspace/\$workspaceId/projects.tsx apps/web/src/components/nav-main.tsx i18n/en-US.json
git commit -m "refactor: move project list to its own /projects route"
```

---

### Task 5: Frontend — dashboard widget components

**Files:**
- Create: `apps/web/src/components/dashboard/status-summary.tsx`
- Create: `apps/web/src/components/dashboard/overdue-tasks-list.tsx`
- Create: `apps/web/src/components/dashboard/project-progress-cards.tsx`
- Create: `apps/web/src/components/dashboard/recent-activity-feed.tsx`
- Modify: `i18n/en-US.json`

**Interfaces:**
- Consumes: `DashboardSummary`'s three arrays (as returned by `useDashboardSummary`, dates as ISO strings), plus `useGetProjects` from `@/hooks/queries/project/use-get-projects` (already existing, returns `{ id, name, icon, statistics: { completionPercentage, totalTasks, dueDate } }[]`).
- Produces: `StatusSummary`, `OverdueTasksList`, `ProjectProgressCards`, `RecentActivityFeed` components — consumed by Task 6's route.

- [ ] **Step 1: Write `status-summary.tsx`**

```tsx
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_COLUMNS } from "@/constants/columns";

type StatusCount = { status: string; count: number };

function statusLabel(status: string) {
  return (
    DEFAULT_COLUMNS.find((column) => column.id === status)?.name ?? status
  );
}

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
                    {statusLabel(row.status)}
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
```

- [ ] **Step 2: Write `overdue-tasks-list.tsx`**

```tsx
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";

type OverdueTask = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  dueDate: string;
  assigneeName: string | null;
};

export function OverdueTasksList({
  workspaceId,
  tasks,
  isLoading,
}: {
  workspaceId: string;
  tasks: OverdueTask[] | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard:overdueTasks.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="flex flex-col divide-y">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="flex items-center justify-between gap-2 py-2 text-left hover:bg-muted/50"
                onClick={() =>
                  navigate({
                    to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
                    params: {
                      workspaceId,
                      projectId: task.projectId,
                      taskId: task.id,
                    },
                  })
                }
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {task.title}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {task.projectName}
                    {task.assigneeName ? ` · ${task.assigneeName}` : ""}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-destructive">
                  {formatRelativeTime(task.dueDate)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>{t("dashboard:overdueTasks.emptyTitle")}</EmptyTitle>
              <EmptyDescription>
                {t("dashboard:overdueTasks.emptyDescription")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Write `project-progress-cards.tsx`**

```tsx
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import icons from "@/constants/project-icons";
import useGetProjects from "@/hooks/queries/project/use-get-projects";

export function ProjectProgressCards({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useGetProjects({ workspaceId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard:projectProgress.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {projects.map((project) => {
              const IconComponent =
                icons[project.icon as keyof typeof icons] || icons.Layout;
              return (
                <button
                  key={project.id}
                  type="button"
                  className="flex flex-col gap-2 rounded-lg border p-3 text-left hover:bg-muted/50"
                  onClick={() =>
                    navigate({
                      to: "/dashboard/workspace/$workspaceId/project/$projectId/board",
                      params: { workspaceId, projectId: project.id },
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate text-sm font-medium">
                      {project.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={project.statistics.completionPercentage}
                      className="h-2 flex-1"
                    />
                    <span className="text-xs text-muted-foreground">
                      {project.statistics.completionPercentage}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t("dashboard:projectProgress.taskCount", {
                      count: project.statistics.totalTasks,
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("dashboard:projectProgress.empty")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Write `recent-activity-feed.tsx`**

```tsx
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";

type ActivityItem = {
  id: string;
  type: string;
  content: string | null;
  createdAt: string;
  userName: string | null;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
};

export function RecentActivityFeed({
  workspaceId,
  items,
  isLoading,
}: {
  workspaceId: string;
  items: ActivityItem[] | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard:recentActivity.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="flex flex-col divide-y">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex items-center justify-between gap-2 py-2 text-left hover:bg-muted/50"
                onClick={() =>
                  navigate({
                    to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
                    params: {
                      workspaceId,
                      projectId: item.projectId,
                      taskId: item.taskId,
                    },
                  })
                }
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    <span className="font-medium">
                      {item.userName ??
                        t("dashboard:recentActivity.unknownUser")}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {item.content ?? item.type}
                    </span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {item.taskTitle} · {item.projectName}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(item.createdAt)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("dashboard:recentActivity.empty")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Add the `dashboard` i18n namespace**

Add a new top-level `"dashboard"` key to `i18n/en-US.json` (alongside the existing `"workload"` key from Task 4's neighborhood, e.g. right before it):

```json
	"dashboard": {
		"pageTitle": "Dashboard",
		"statusSummary": {
			"title": "Task status",
			"empty": "No tasks yet"
		},
		"overdueTasks": {
			"title": "Overdue tasks",
			"emptyTitle": "Nothing overdue",
			"emptyDescription": "Tasks past their due date will show up here."
		},
		"projectProgress": {
			"title": "Projects",
			"empty": "No projects yet",
			"taskCount_one": "{{count}} task",
			"taskCount_other": "{{count}} tasks"
		},
		"recentActivity": {
			"title": "Recent activity",
			"empty": "No recent activity",
			"unknownUser": "Someone"
		}
	},
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @kaneo/web typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/dashboard i18n/en-US.json
git commit -m "feat: add workspace dashboard widget components"
```

---

### Task 6: Frontend — dashboard route

**Files:**
- Create: `apps/web/src/routes/_layout/_authenticated/dashboard/workspace/$workspaceId/index.tsx`

**Interfaces:**
- Consumes: `useDashboardSummary` (Task 3), `StatusSummary`/`OverdueTasksList`/`ProjectProgressCards`/`RecentActivityFeed` (Task 5), `WorkspaceLayout` (existing, `apps/web/src/components/common/workspace-layout.tsx`), `PageTitle` (existing, `apps/web/src/components/page-title.tsx`).

- [ ] **Step 1: Write the route**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { OverdueTasksList } from "@/components/dashboard/overdue-tasks-list";
import { ProjectProgressCards } from "@/components/dashboard/project-progress-cards";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { StatusSummary } from "@/components/dashboard/status-summary";
import PageTitle from "@/components/page-title";
import { useDashboardSummary } from "@/hooks/queries/dashboard/use-dashboard-summary";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();
  const { data, isLoading } = useDashboardSummary(workspaceId);

  return (
    <>
      <PageTitle title={t("dashboard:pageTitle")} />
      <WorkspaceLayout title={t("dashboard:pageTitle")}>
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <StatusSummary
            statusCounts={data?.statusCounts}
            isLoading={isLoading}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OverdueTasksList
              workspaceId={workspaceId}
              tasks={data?.overdueTasks}
              isLoading={isLoading}
            />
            <RecentActivityFeed
              workspaceId={workspaceId}
              items={data?.recentActivity}
              isLoading={isLoading}
            />
          </div>
          <ProjectProgressCards workspaceId={workspaceId} />
        </div>
      </WorkspaceLayout>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @kaneo/web typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_layout/_authenticated/dashboard/workspace/\$workspaceId/index.tsx
git commit -m "feat: add workspace dashboard route"
```

---

### Task 7: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev stack**

Use the project's `run` skill (or `pnpm dev`) to start the API and web app against a local Postgres instance.

- [ ] **Step 2: Walk the golden path**

In a browser: sign in, open a workspace with at least one project and a few tasks (including one with a past due date and one assigned). Confirm:
- Workspace root now shows the dashboard: status tiles, overdue list, project cards, recent activity.
- Clicking an overdue task and an activity row navigates to that task's detail view.
- Clicking a project card navigates to that project's board.
- The sidebar shows both "Dashboard" and "Projects" entries, and "Projects" opens the original project list at `/projects` (reorder-by-drag still works there).
- A workspace with zero projects, zero overdue tasks, and zero activity shows the empty states from Task 5/6, not a crash.

- [ ] **Step 3: Report results**

Note any visual or behavioral issues found; fix before considering the feature done.

---

## Self-Review Notes

- **Spec coverage:** status summary (Task 5/6), overdue tasks (Task 1/5/6), project progress cards (Task 5/6, reusing `useGetProjects` per spec), recent activity (Task 1/5/6), routing swap + nav (Task 4), no realtime wiring (unchanged — plain query fetch), i18n additions (Tasks 4 and 5). All spec sections have a task.
- **Type consistency:** `DashboardOverdueTask`/`DashboardActivityItem` (Task 1) both carry `projectId` — required so the frontend can build task-detail navigation params in Task 5; verified the widget prop types in Task 5 match the controller's field names exactly (`taskId`, `taskTitle`, `projectId`, `projectName`, `assigneeName`, `dueDate`, `createdAt`).
- **No placeholders:** every step has runnable code or an exact command with expected output.
