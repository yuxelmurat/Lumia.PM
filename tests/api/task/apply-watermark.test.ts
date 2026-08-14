import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyWatermark } from "../../../apps/api/src/task/utils/apply-watermark";

const WATERMARK_URL = "http://watermark.test/logo.png";

async function makeBaseImage(): Promise<Buffer> {
  return sharp({
    create: {
      width: 200,
      height: 100,
      channels: 3,
      background: { r: 200, g: 30, b: 30 },
    },
  })
    .png()
    .toBuffer();
}

async function makeWatermarkImage(): Promise<Buffer> {
  return sharp({
    create: {
      width: 40,
      height: 40,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

describe("applyWatermark", () => {
  // applyWatermark downloads the watermark image through assertPublicDestination
  // (an SSRF guard that DNS-resolves the host); bypass it here the same way
  // other tests exercising that guard's callers do, and stub global.fetch so
  // no real network call happens.
  const originalAllowPrivate =
    process.env.KANEO_ALLOW_PRIVATE_WEBHOOK_DESTINATIONS;

  beforeEach(() => {
    process.env.KANEO_ALLOW_PRIVATE_WEBHOOK_DESTINATIONS = "true";
  });

  afterEach(() => {
    if (originalAllowPrivate === undefined) {
      delete process.env.KANEO_ALLOW_PRIVATE_WEBHOOK_DESTINATIONS;
    } else {
      process.env.KANEO_ALLOW_PRIVATE_WEBHOOK_DESTINATIONS =
        originalAllowPrivate;
    }
    vi.unstubAllGlobals();
  });

  async function stubWatermarkFetch() {
    const buffer = await makeWatermarkImage();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(buffer, { status: 200 })),
    );
  }

  it("produces different bytes for the corner style", async () => {
    await stubWatermarkFetch();
    const base = await makeBaseImage();
    const watermarkImageUrl = WATERMARK_URL;

    const result = await applyWatermark(base, "image/png", {
      style: "corner",
      watermarkImageUrl,
      corner: "bottom-right",
      sizePercent: 20,
    });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.equals(base)).toBe(false);

    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(100);
  });

  it("produces different bytes for the center style", async () => {
    await stubWatermarkFetch();
    const base = await makeBaseImage();
    const watermarkImageUrl = WATERMARK_URL;

    const result = await applyWatermark(base, "image/png", {
      style: "center",
      watermarkImageUrl,
      corner: "bottom-right",
      sizePercent: 20,
    });

    expect(result.equals(base)).toBe(false);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(100);
  });

  it("produces different bytes for the tile style", async () => {
    await stubWatermarkFetch();
    const base = await makeBaseImage();
    const watermarkImageUrl = WATERMARK_URL;

    const result = await applyWatermark(base, "image/png", {
      style: "tile",
      watermarkImageUrl,
      corner: "bottom-right",
      sizePercent: 20,
    });

    expect(result.equals(base)).toBe(false);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(100);
  });

  it("throws for content types it cannot confidently re-encode", async () => {
    const base = await makeBaseImage();

    await expect(
      applyWatermark(base, "image/heic", {
        style: "corner",
        watermarkImageUrl: WATERMARK_URL,
        corner: "bottom-right",
        sizePercent: 20,
      }),
    ).rejects.toThrow();
  });

  it("throws when the watermark image can't be downloaded", async () => {
    const base = await makeBaseImage();

    await expect(
      applyWatermark(base, "image/png", {
        style: "corner",
        watermarkImageUrl: "http://127.0.0.1:1/does-not-exist.png",
        corner: "bottom-right",
        sizePercent: 20,
      }),
    ).rejects.toThrow();
  });
});
