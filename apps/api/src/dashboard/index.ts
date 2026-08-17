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
