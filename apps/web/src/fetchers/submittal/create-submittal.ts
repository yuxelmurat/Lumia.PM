import { client } from "@kaneo/libs";

async function createSubmittal({
  projectId,
  title,
  specSection,
  description,
  assigneeUserId,
  dueDate,
  supersedesSubmittalId,
}: {
  projectId: string;
  title: string;
  specSection?: string | null;
  description: string;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  supersedesSubmittalId?: string | null;
}) {
  const response = await client.submittal[":projectId"].$post({
    param: { projectId },
    json: {
      title,
      specSection,
      description,
      assigneeUserId,
      dueDate,
      supersedesSubmittalId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createSubmittal;
