import { client } from "@kaneo/libs";

async function updateRfi({
  id,
  subject,
  question,
  assigneeUserId,
  dueDate,
  answer,
  status,
}: {
  id: string;
  subject?: string;
  question?: string;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  answer?: string;
  status?: "open" | "answered" | "closed";
}) {
  const response = await client.rfi.item[":id"].$patch({
    param: { id },
    json: { subject, question, assigneeUserId, dueDate, answer, status },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateRfi;
