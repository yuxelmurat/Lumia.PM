import sharp, { type Sharp } from "sharp";
import { assertPublicDestination } from "../../utils/assert-public-destination";

/**
 * Watermarking for task images in *public* projects.
 *
 * This is a branding/deterrent feature, not DRM or a security control: it
 * stamps a visible mark onto renders shared via the public-project link so
 * a client can't casually forward an unwatermarked file before they've
 * approved/paid. A determined person can still screenshot, crop, or
 * otherwise strip it — that's an accepted tradeoff for keeping this simple.
 */

export type WatermarkStyle = "tile" | "center" | "corner";
export type WatermarkCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type WatermarkSettings = {
  style: WatermarkStyle;
  /** Already resolved by the caller: workspace.watermarkImageUrl ?? workspace.logo. */
  watermarkImageUrl: string;
  corner: WatermarkCorner;
  sizePercent: number;
};

const MIN_WATERMARK_SIZE_PERCENT = 5;
const MAX_WATERMARK_SIZE_PERCENT = 80;
const MIN_WATERMARK_PIXELS = 24;
const CORNER_PADDING = 16;

// Content types this module knows how to decode *and* confidently
// re-encode back to their original format. Formats not in this set (gif,
// avif, heic, heif, apng, ...) are skipped by the caller rather than
// forced through sharp, since animated/exotic formats can silently lose
// data (e.g. animation) or fail to encode depending on the sharp build.
const WATERMARKABLE_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export function isWatermarkableContentType(contentType: string) {
  return WATERMARKABLE_CONTENT_TYPES.has(contentType.toLowerCase());
}

function clampSizePercent(sizePercent: number) {
  if (!Number.isFinite(sizePercent)) return 20;
  return Math.min(
    MAX_WATERMARK_SIZE_PERCENT,
    Math.max(MIN_WATERMARK_SIZE_PERCENT, Math.round(sizePercent)),
  );
}

function outputFormatFor(contentType: string): "png" | "jpeg" | "webp" {
  switch (contentType.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpeg";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
}

async function encodeAs(
  image: Sharp,
  format: "png" | "jpeg" | "webp",
): Promise<Buffer> {
  if (format === "jpeg") return image.jpeg().toBuffer();
  if (format === "webp") return image.webp().toBuffer();
  return image.png().toBuffer();
}

/**
 * Downloads the workspace's watermark image (logo or custom watermark URL).
 * The URL is admin-supplied workspace settings, fetched server-side on every
 * matching upload — without this check it would be an SSRF vector letting a
 * workspace admin point the server at internal-only addresses.
 */
async function fetchWatermarkImageBuffer(url: string): Promise<Buffer> {
  await assertPublicDestination(url, "Watermark image");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download watermark image (${response.status} ${response.statusText}).`,
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Multiplies a PNG buffer's alpha channel by `opacity` (0-1). sharp has no
 * single "set opacity" operator on composite(), so we go through raw pixel
 * data: ensure an alpha channel exists, then scale it directly.
 */
async function applyOpacity(
  imageBuffer: Buffer,
  opacity: number,
): Promise<Buffer> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 3; i < data.length; i += info.channels) {
    const alpha = data[i];
    if (alpha === undefined) continue;
    data[i] = Math.round(alpha * opacity);
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

async function resizeWatermark(
  watermarkBuffer: Buffer,
  targetWidth: number,
): Promise<Buffer> {
  return sharp(watermarkBuffer)
    .resize({ width: Math.max(MIN_WATERMARK_PIXELS, Math.round(targetWidth)) })
    .png()
    .toBuffer();
}

function cornerOffsets(
  corner: WatermarkCorner,
  baseWidth: number,
  baseHeight: number,
  wmWidth: number,
  wmHeight: number,
) {
  const left =
    corner === "top-left" || corner === "bottom-left"
      ? CORNER_PADDING
      : baseWidth - wmWidth - CORNER_PADDING;
  const top =
    corner === "top-left" || corner === "top-right"
      ? CORNER_PADDING
      : baseHeight - wmHeight - CORNER_PADDING;
  return {
    left: Math.max(0, Math.round(left)),
    top: Math.max(0, Math.round(top)),
  };
}

async function applyCornerWatermark(
  base: Sharp,
  baseWidth: number,
  baseHeight: number,
  watermarkBuffer: Buffer,
  settings: WatermarkSettings,
) {
  const shorterDim = Math.min(baseWidth, baseHeight);
  const targetWidth =
    (clampSizePercent(settings.sizePercent) / 100) * shorterDim;

  const resized = await resizeWatermark(watermarkBuffer, targetWidth);
  const withOpacity = await applyOpacity(resized, 0.9);
  const { width: wmWidth = 0, height: wmHeight = 0 } =
    await sharp(withOpacity).metadata();

  const { left, top } = cornerOffsets(
    settings.corner,
    baseWidth,
    baseHeight,
    wmWidth,
    wmHeight,
  );

  return base.composite([{ input: withOpacity, left, top, blend: "over" }]);
}

async function applyCenterWatermark(
  base: Sharp,
  baseWidth: number,
  baseHeight: number,
  watermarkBuffer: Buffer,
  settings: WatermarkSettings,
) {
  const shorterDim = Math.min(baseWidth, baseHeight);
  // A "center" watermark is meant to read as large/obvious per the product
  // ask, so floor the effective size at 50% here even if the workspace has
  // a smaller value stored (that stored value is tuned for "corner").
  const effectiveSizePercent = Math.max(
    50,
    clampSizePercent(settings.sizePercent),
  );
  const targetWidth = (effectiveSizePercent / 100) * shorterDim;

  const resized = await resizeWatermark(watermarkBuffer, targetWidth);
  const withOpacity = await applyOpacity(resized, 0.28);
  const { width: wmWidth = 0, height: wmHeight = 0 } =
    await sharp(withOpacity).metadata();

  const left = Math.max(0, Math.round((baseWidth - wmWidth) / 2));
  const top = Math.max(0, Math.round((baseHeight - wmHeight) / 2));

  return base.composite([{ input: withOpacity, left, top, blend: "over" }]);
}

async function applyTileWatermark(
  base: Sharp,
  baseWidth: number,
  baseHeight: number,
  watermarkBuffer: Buffer,
) {
  const wmMeta = await sharp(watermarkBuffer).metadata();
  const wmFormat = wmMeta.format === "jpeg" ? "jpeg" : "png";
  const wmMime = wmFormat === "jpeg" ? "image/jpeg" : "image/png";
  const wmPng = await sharp(watermarkBuffer)
    [wmFormat === "jpeg" ? "jpeg" : "png"]()
    .toBuffer();
  const base64 = wmPng.toString("base64");

  const shorterDim = Math.min(baseWidth, baseHeight);
  const tileSize = Math.max(
    MIN_WATERMARK_PIXELS,
    Math.round(shorterDim * 0.18),
  );

  const svg = `
    <svg width="${baseWidth}" height="${baseHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="watermark-tile" width="${tileSize}" height="${tileSize}"
          patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <image href="data:${wmMime};base64,${base64}" x="0" y="0"
            width="${tileSize}" height="${tileSize}"
            preserveAspectRatio="xMidYMid meet" opacity="0.13" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermark-tile)" />
    </svg>
  `;

  const patternLayer = await sharp(Buffer.from(svg))
    .resize(baseWidth, baseHeight)
    .png()
    .toBuffer();

  return base.composite([
    { input: patternLayer, left: 0, top: 0, blend: "over" },
  ]);
}

/**
 * Composites a watermark onto `imageBuffer` and re-encodes it in its
 * original format. Throws on any failure (unresolvable content type,
 * failed watermark download, decode error) — callers are expected to catch
 * this and fall back to storing the original, unwatermarked image rather
 * than blocking the upload.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  contentType: string,
  settings: WatermarkSettings,
): Promise<Buffer> {
  if (!isWatermarkableContentType(contentType)) {
    throw new Error(
      `Unsupported content type for watermarking: ${contentType}`,
    );
  }

  const watermarkBuffer = await fetchWatermarkImageBuffer(
    settings.watermarkImageUrl,
  );

  const base = sharp(imageBuffer);
  const baseMeta = await base.metadata();
  const baseWidth = baseMeta.width;
  const baseHeight = baseMeta.height;

  if (!baseWidth || !baseHeight) {
    throw new Error("Could not determine base image dimensions.");
  }

  let composited: Sharp;
  if (settings.style === "corner") {
    composited = await applyCornerWatermark(
      sharp(imageBuffer),
      baseWidth,
      baseHeight,
      watermarkBuffer,
      settings,
    );
  } else if (settings.style === "center") {
    composited = await applyCenterWatermark(
      sharp(imageBuffer),
      baseWidth,
      baseHeight,
      watermarkBuffer,
      settings,
    );
  } else {
    composited = await applyTileWatermark(
      sharp(imageBuffer),
      baseWidth,
      baseHeight,
      watermarkBuffer,
    );
  }

  const format = outputFormatFor(contentType);
  return encodeAs(composited, format);
}
