import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import getWorkload from "./controllers/get-workload";

const workloadWeekSchema = v.object({
  weekStart: v.string(),
  totalHours: v.number(),
  taskCount: v.number(),
});

const workloadRowSchema = v.object({
  userId: v.string(),
  userName: v.nullable(v.string()),
  weeks: v.array(workloadWeekSchema),
});

function defaultRange() {
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 27);
  return { from, to };
}

const workload = new Hono<{
  Variables: {
    userId: string;
  };
}>().get(
  "/:workspaceId",
  describeRoute({
    operationId: "getWorkload",
    tags: ["Workload"],
    description:
      "Aggregate open task estimated hours by assignee and due-date week for a workspace",
    responses: {
      200: {
        description: "Workload rows grouped by assignee and week",
        content: {
          "application/json": { schema: resolver(v.array(workloadRowSchema)) },
        },
      },
    },
  }),
  validator("param", v.object({ workspaceId: v.string() })),
  validator(
    "query",
    v.object({
      from: v.optional(v.string()),
      to: v.optional(v.string()),
    }),
  ),
  workspaceAccess.fromParam(),
  requireWorkspacePermission({ task: ["read"] }),
  async (c) => {
    const { workspaceId } = c.req.valid("param");
    const { from: fromParam, to: toParam } = c.req.valid("query");

    const { from: defaultFrom, to: defaultTo } = defaultRange();
    const from = fromParam ? new Date(fromParam) : defaultFrom;
    const to = toParam ? new Date(toParam) : defaultTo;

    const rows = await getWorkload(workspaceId, from, to);

    return c.json(rows);
  },
);

export default workload;
