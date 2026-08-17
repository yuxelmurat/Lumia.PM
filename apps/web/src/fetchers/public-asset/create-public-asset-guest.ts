import { client } from "@kaneo/libs";

async function createPublicAssetGuest({
  token,
  name,
  email,
}: {
  token: string;
  name: string;
  email: string;
}) {
  const response = await client["public-asset"][":token"].guest.$post({
    param: { token },
    json: { name, email },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createPublicAssetGuest;
