import { client } from "@kaneo/libs";

async function createProductSpecImageUpload({
  projectId,
  filename,
  contentType,
  size,
}: {
  projectId: string;
  filename: string;
  contentType: string;
  size: number;
}) {
  const response = await client["product-spec"]["image-upload"][
    ":projectId"
  ].$put({
    param: { projectId },
    json: { filename, contentType, size },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export async function finalizeProductSpecImageUpload({
  projectId,
  key,
  filename,
  contentType,
  size,
}: {
  projectId: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
}) {
  const response = await client["product-spec"]["image-upload"][
    ":projectId"
  ].finalize.$post({
    param: { projectId },
    json: { key, filename, contentType, size },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export default createProductSpecImageUpload;
