import { client } from "@kaneo/libs";

// Same untyped-body situation as set-public-task-approval.ts — the route
// reads its JSON body by hand rather than through a Valibot validator, so
// the payload shape is typed manually here.
export type SetPublicTaskApprovalByTokenRequest = {
  token: string;
  status: "approved" | "changes_requested";
  clientName: string;
  note?: string;
};

async function setPublicTaskApprovalByToken({
  token,
  status,
  clientName,
  note,
}: SetPublicTaskApprovalByTokenRequest) {
  const endpoint = client["public-task"][":token"].approval;

  const response = await endpoint.$put({
    param: { token },
    json: { status, clientName, note },
  } as Parameters<typeof endpoint.$put>[0]);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default setPublicTaskApprovalByToken;
