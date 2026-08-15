import { ImageUp, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

const MAX_SOURCE_FILE_BYTES = 5 * 1024 * 1024; // 5MB, before client-side resize
const MAX_DIMENSION = 320;

function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a valid image."));
      img.onload = () => resolve(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function resizeToDataUrl(img: HTMLImageElement): string {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Image resizing isn't supported in this browser.");
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}

/**
 * Logo/watermark image field: a real "pick a file" + drag-and-drop upload,
 * not a raw URL text box. Resizes client-side and stores the result as a
 * data: URI directly in the field value — the same value shape the field
 * already accepted, so no new backend storage was needed. An external URL
 * can still be pasted in for a studio that already hosts its logo elsewhere.
 */
export function ImageUploadField({
  value,
  onChange,
  onBlur,
  disabled,
  previewClassName = "h-10 w-10",
}: {
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  previewClassName?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlField, setShowUrlField] = useState(
    Boolean(value) && !value.startsWith("data:"),
  );

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("common:imageUpload.errorInvalidType"));
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      toast.error(t("common:imageUpload.errorTooLarge"));
      return;
    }
    try {
      const img = await readFileAsImage(file);
      const dataUrl = resizeToDataUrl(img);
      onChange(dataUrl);
      onBlur?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("common:imageUpload.errorProcessing"),
      );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40 ${previewClassName}`}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImageUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (!disabled) handleFile(event.dataTransfer.files?.[0]);
          }}
          className={`flex-1 rounded-md border border-dashed px-3 py-2 text-left text-xs transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-accent"
          } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <span className="font-medium text-foreground">
            {t("common:imageUpload.clickToUpload")}
          </span>{" "}
          <span className="text-muted-foreground">
            {t("common:imageUpload.orDragImage")}
          </span>
        </button>

        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => {
              onChange("");
              onBlur?.();
            }}
            aria-label={t("common:imageUpload.removeImage")}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {showUrlField ? (
        <Input
          className="text-xs"
          placeholder="https://example.com/logo.png"
          disabled={disabled}
          value={value.startsWith("data:") ? "" : value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowUrlField(true)}
          className="text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("common:imageUpload.pasteUrlInstead")}
        </button>
      )}
    </div>
  );
}
