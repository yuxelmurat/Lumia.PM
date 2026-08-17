import createProductSpecImageUpload, {
  finalizeProductSpecImageUpload,
} from "@/fetchers/product-spec/create-image-upload";
import { isSupportedImageFile } from "@/lib/upload-task-image";

export async function uploadProductSpecImage({
  projectId,
  file,
}: {
  projectId: string;
  file: File;
}) {
  if (!isSupportedImageFile(file)) {
    throw new Error("Only image files are supported.");
  }

  const upload = await createProductSpecImageUpload({
    projectId,
    filename: file.name || "image",
    contentType: file.type,
    size: file.size,
  });

  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: upload.headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file to storage.");
  }

  const asset = await finalizeProductSpecImageUpload({
    projectId,
    key: upload.key,
    filename: file.name || "image",
    contentType: file.type,
    size: file.size,
  });

  return asset;
}
