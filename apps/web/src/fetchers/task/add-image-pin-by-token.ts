import { client } from "@kaneo/libs";

// Same untyped-body situation as add-image-pin.ts — the route reads its
// JSON body by hand rather than through a Valibot validator, so the
// payload shape is typed manually here.
export type AddImagePinByTokenRequest = {
  token: string;
  assetId: string;
  clientName: string;
  content: string;
  xPercent: number;
  yPercent: number;
};

async function addImagePinByToken({
  token,
  assetId,
  clientName,
  content,
  xPercent,
  yPercent,
}: AddImagePinByTokenRequest) {
  const endpoint = client["public-task"][":token"].asset[":assetId"].pin;

  const response = await endpoint.$put({
    param: { token, assetId },
    json: { clientName, content, xPercent, yPercent },
  } as Parameters<typeof endpoint.$put>[0]);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default addImagePinByToken;
