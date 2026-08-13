import { client } from "@kaneo/libs";

async function updateSubmittal({
  id,
  title,
  specSection,
  description,
  assigneeUserId,
  dueDate,
  status,
  reviewNote,
}: {
  id: string;
  title?: string;
  specSection?: string | null;
  description?: string;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  status?: "open" | "approved" | "revise_resubmit" | "closed";
  reviewNote?: string | null;
}) {
  const response = await client.submittal.item[":id"].$patch({
    param: { id },
    json: {
      title,
      specSection,
      description,
      assigneeUserId,
      dueDate,
      status,
      reviewNote,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default updateSubmittal;
