import { client } from "@kaneo/libs";

async function getPublicTask(token: string) {
  const response = await client["public-task"][":token"].$get({
    param: { token },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default getPublicTask;
