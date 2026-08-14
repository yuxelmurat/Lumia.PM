import { client } from "@kaneo/libs";
import type { InferRequestType } from "hono/client";

export type ResetTaskApprovalRequest = InferRequestType<
  (typeof client)["task"][":id"]["approval"]["reset"]["$put"]
>["param"];

async function resetTaskApproval({ id }: ResetTaskApprovalRequest) {
  const response = await client.task[":id"].approval.reset.$put({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data;
}

export default resetTaskApproval;
