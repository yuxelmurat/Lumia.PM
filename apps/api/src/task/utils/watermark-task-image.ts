import { getPrivateObject, putPrivateObject } from "../../storage/s3";
import {
  applyWatermark,
  isWatermarkableContentType,
  type WatermarkCorner,
  type WatermarkStyle,
} from "./apply-watermark";

export type WatermarkGateInput = {
  /** Whether the task's project is public (client-facing link enabled). */
  isPublic: boolean;
  /** The task's workspace watermark settings. */
  watermarkEnabled: boolean;
  watermarkImageUrl: string | null;
  watermarkStyle: string | null;
  watermarkCorner: string | null;
  watermarkSizePercent: number | null;
  /** The just-finalized upload's object key and content type. */
  objectKey: string;
  contentType: string;
};

const VALID_STYLES: WatermarkStyle[] = ["tile", "center", "corner"];
const VALID_CORNERS: WatermarkCorner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

/**
 * Watermarks a just-uploaded task image in place (same object key) when the
 * task's project is public and the workspace has watermarking enabled.
 *
 * This bakes the watermark into the stored bytes permanently at upload
 * time. Toggling the workspace setting afterward only affects future
 * uploads — it never retroactively re-watermarks (or un-watermarks)
 * existing files. That's a deliberate scope choice: dynamic per-request
 * compositing would be more "correct" but adds real complexity/cost for a
 * branding deterrent, not a security control.
 *
 * Never throws: any failure (missing watermark source, download error,
 * decode error, storage error) is logged and swallowed so a watermarking
 * bug can never block an otherwise-successful upload. The original,
 * unwatermarked bytes are left in place whenever watermarking is skipped
 * or fails.
 */
export async function watermarkTaskImageIfNeeded(
  input: WatermarkGateInput,
): Promise<void> {
  if (!input.isPublic) return;
  if (!input.watermarkEnabled) return;

  const watermarkImageUrl = input.watermarkImageUrl?.trim();
  if (!watermarkImageUrl) {
    console.warn(
      "Watermarking is enabled but no watermark image or workspace logo is set; skipping watermark for",
      input.objectKey,
    );
    return;
  }

  if (!isWatermarkableContentType(input.contentType)) {
    return;
  }

  const style = VALID_STYLES.includes(input.watermarkStyle as WatermarkStyle)
    ? (input.watermarkStyle as WatermarkStyle)
    : "corner";
  const corner = VALID_CORNERS.includes(
    input.watermarkCorner as WatermarkCorner,
  )
    ? (input.watermarkCorner as WatermarkCorner)
    : "bottom-right";
  const sizePercent = input.watermarkSizePercent ?? 20;

  try {
    const object = await getPrivateObject(input.objectKey);
    const buffer = await streamToBuffer(object.body);

    const watermarked = await applyWatermark(buffer, input.contentType, {
      style,
      watermarkImageUrl,
      corner,
      sizePercent,
    });

    await putPrivateObject(input.objectKey, watermarked, input.contentType);
  } catch (error) {
    console.error(
      "Failed to watermark task image; storing the original, unwatermarked upload instead.",
      input.objectKey,
      error,
    );
  }
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body;

  if (body instanceof ReadableStream) {
    const chunks: Uint8Array[] = [];
    const reader = body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  }

  throw new Error("Unsupported storage object body type for watermarking.");
}
