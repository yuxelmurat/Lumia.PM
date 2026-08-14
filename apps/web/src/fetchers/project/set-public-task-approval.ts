import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

// The public approval PUT route reads its body via `c.req.json()` without a
// Valibot json validator, so hono's client type has no `json` field to
// infer from (only `param`). The route genuinely accepts this body shape at
// runtime (see apps/api/src/task/controllers/set-task-approval.ts), so the
// request payload is typed by hand and the call is cast to the endpoint's
// own param signature to satisfy the client's stricter inferred type.
export type SetPublicTaskApprovalRequest = InferRequestType<
  (typeof client)["public-project"][":projectId"]["task"][":taskId"]["approval"]["$put"]
>["param"] & {
  status: "approved" | "changes_requested";
  clientName: string;
  note?: string;
};

async function setPublicTaskApproval({
  projectId,
  taskId,
  status,
  clientName,
  note,
}: SetPublicTaskApprovalRequest) {
  const endpoint =
    client["public-project"][":projectId"].task[":taskId"].approval;

  const response = await endpoint.$put({
    param: { projectId, taskId },
    json: { status, clientName, note },
  } as Parameters<typeof endpoint.$put>[0]);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default setPublicTaskApproval;
