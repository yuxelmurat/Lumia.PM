import { client } from "@kaneo/libs";

async function createRfi({
  projectId,
  subject,
  question,
  assigneeUserId,
  dueDate,
}: {
  projectId: string;
  subject: string;
  question: string;
  assigneeUserId?: string | null;
  dueDate?: string | null;
}) {
  const response = await client.rfi[":projectId"].$post({
    param: { projectId },
    json: { subject, question, assigneeUserId, dueDate },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createRfi;
