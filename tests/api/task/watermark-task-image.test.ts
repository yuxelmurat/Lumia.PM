import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPrivateObject = vi.fn();
const mockPutPrivateObject = vi.fn();
const mockApplyWatermark = vi.fn();

vi.mock("../../../apps/api/src/storage/s3", () => ({
  getPrivateObject: (...args: unknown[]) => mockGetPrivateObject(...args),
  putPrivateObject: (...args: unknown[]) => mockPutPrivateObject(...args),
}));

vi.mock("../../../apps/api/src/task/utils/apply-watermark", async () => {
  const actual = await vi.importActual<
    typeof import("../../../apps/api/src/task/utils/apply-watermark")
  >("../../../apps/api/src/task/utils/apply-watermark");
  return {
    ...actual,
    applyWatermark: (...args: unknown[]) => mockApplyWatermark(...args),
  };
});

import { watermarkTaskImageIfNeeded } from "../../../apps/api/src/task/utils/watermark-task-image";

const BASE_INPUT = {
  isPublic: true,
  watermarkEnabled: true,
  watermarkImageUrl: "https://example.com/logo.png",
  watermarkStyle: "corner",
  watermarkCorner: "bottom-right",
  watermarkSizePercent: 20,
  objectKey: "workspace/w1/project/p1/task/t1/descriptions/img.png",
  contentType: "image/png",
};

describe("watermarkTaskImageIfNeeded", () => {
  beforeEach(() => {
    mockGetPrivateObject.mockReset();
    mockPutPrivateObject.mockReset();
    mockApplyWatermark.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips when the project is not public", async () => {
    await watermarkTaskImageIfNeeded({ ...BASE_INPUT, isPublic: false });

    expect(mockGetPrivateObject).not.toHaveBeenCalled();
    expect(mockApplyWatermark).not.toHaveBeenCalled();
    expect(mockPutPrivateObject).not.toHaveBeenCalled();
  });

  it("skips when the workspace has not enabled watermarking", async () => {
    await watermarkTaskImageIfNeeded({
      ...BASE_INPUT,
      watermarkEnabled: false,
    });

    expect(mockGetPrivateObject).not.toHaveBeenCalled();
    expect(mockApplyWatermark).not.toHaveBeenCalled();
    expect(mockPutPrivateObject).not.toHaveBeenCalled();
  });

  it("skips when no watermark image or logo resolves", async () => {
    await watermarkTaskImageIfNeeded({
      ...BASE_INPUT,
      watermarkImageUrl: null,
    });

    expect(mockGetPrivateObject).not.toHaveBeenCalled();
    expect(mockApplyWatermark).not.toHaveBeenCalled();
    expect(mockPutPrivateObject).not.toHaveBeenCalled();
  });

  it("watermarks and re-uploads to the same object key when enabled for a public project", async () => {
    const fakeStream = {} as ReadableStream;
    mockGetPrivateObject.mockResolvedValue({
      body: fakeStream,
      contentType: "image/png",
      contentLength: 100,
      etag: "abc",
      lastModified: new Date(),
    });
    // Stand in for streamToBuffer's ReadableStream handling by mocking
    // getPrivateObject to hand back something streamToBuffer accepts: a
    // Buffer body is supported directly.
    mockGetPrivateObject.mockResolvedValue({
      body: Buffer.from("original-bytes"),
      contentType: "image/png",
      contentLength: 100,
      etag: "abc",
      lastModified: new Date(),
    });
    mockApplyWatermark.mockResolvedValue(Buffer.from("watermarked-bytes"));

    await watermarkTaskImageIfNeeded(BASE_INPUT);

    expect(mockGetPrivateObject).toHaveBeenCalledWith(BASE_INPUT.objectKey);
    expect(mockApplyWatermark).toHaveBeenCalledWith(
      Buffer.from("original-bytes"),
      "image/png",
      {
        style: "corner",
        watermarkImageUrl: "https://example.com/logo.png",
        corner: "bottom-right",
        sizePercent: 20,
      },
    );
    expect(mockPutPrivateObject).toHaveBeenCalledWith(
      BASE_INPUT.objectKey,
      Buffer.from("watermarked-bytes"),
      "image/png",
    );
  });

  it("does not throw and leaves the original in place when watermarking fails", async () => {
    mockGetPrivateObject.mockResolvedValue({
      body: Buffer.from("original-bytes"),
      contentType: "image/png",
      contentLength: 100,
      etag: "abc",
      lastModified: new Date(),
    });
    mockApplyWatermark.mockRejectedValue(new Error("boom"));

    await expect(
      watermarkTaskImageIfNeeded(BASE_INPUT),
    ).resolves.toBeUndefined();

    expect(mockPutPrivateObject).not.toHaveBeenCalled();
  });

  it("skips unwatermarkable content types without calling S3 helpers", async () => {
    await watermarkTaskImageIfNeeded({
      ...BASE_INPUT,
      contentType: "image/heic",
    });

    expect(mockGetPrivateObject).not.toHaveBeenCalled();
    expect(mockApplyWatermark).not.toHaveBeenCalled();
    expect(mockPutPrivateObject).not.toHaveBeenCalled();
  });
});
