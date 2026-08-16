import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ImagePin, TaskImage } from "@/types/task";

type PendingPin = { xPercent: number; yPercent: number };

type TaskImageGalleryProps = {
  images: TaskImage[];
  /** Lets a viewer click the image to drop a new pin comment. */
  canAddPin?: boolean;
  /** Asked once per pin when the viewer's identity isn't already known (public client view). */
  requireNameForPin?: boolean;
  defaultPinAuthorName?: string;
  onAddPin?: (args: {
    image: TaskImage;
    xPercent: number;
    yPercent: number;
    content: string;
    clientName?: string;
  }) => Promise<void>;
  /** Lets a viewer mark a pin resolved/unresolved or remove it (team view). */
  canManagePins?: boolean;
  onResolvePin?: (pin: ImagePin, resolved: boolean) => void;
  onDeletePin?: (pin: ImagePin) => void;
};

export function TaskImageGallery({
  images,
  canAddPin = false,
  requireNameForPin = false,
  defaultPinAuthorName = "",
  onAddPin,
  canManagePins = false,
  onResolvePin,
  onDeletePin,
}: TaskImageGalleryProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [pendingContent, setPendingContent] = useState("");
  const [pendingAuthorName, setPendingAuthorName] =
    useState(defaultPinAuthorName);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (pendingPin) return;
      if (event.key === "ArrowRight") {
        setActiveIndex((index) =>
          index === null ? null : (index + 1) % images.length,
        );
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((index) =>
          index === null ? null : (index - 1 + images.length) % images.length,
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length, pendingPin]);

  if (images.length === 0) return null;

  const activeImage = activeIndex !== null ? images[activeIndex] : null;
  const pins = activeImage?.pins ?? [];

  const closePendingPin = () => {
    setPendingPin(null);
    setPendingContent("");
  };

  const handleImageClick = (event: ReactMouseEvent<HTMLImageElement>) => {
    if (!canAddPin) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    setActivePinId(null);
    setPendingPin({ xPercent, yPercent });
  };

  const handleSubmitPin = async () => {
    if (!activeImage || !pendingPin || !onAddPin) return;
    const trimmedContent = pendingContent.trim();
    if (!trimmedContent) return;
    if (requireNameForPin && !pendingAuthorName.trim()) return;

    setIsSubmittingPin(true);
    try {
      await onAddPin({
        image: activeImage,
        xPercent: pendingPin.xPercent,
        yPercent: pendingPin.yPercent,
        content: trimmedContent,
        clientName: requireNameForPin ? pendingAuthorName.trim() : undefined,
      });
      closePendingPin();
    } finally {
      setIsSubmittingPin(false);
    }
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {t("tasks:gallery.title")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted group/thumb"
            onClick={() => setActiveIndex(index)}
          >
            <img
              src={image.url}
              alt={image.filename}
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105"
            />
            {image.versionNumber > 1 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium leading-none">
                {t("tasks:gallery.versionBadge", {
                  number: image.versionNumber,
                })}
              </span>
            )}
            {image.pins && image.pins.length > 0 && (
              <span className="absolute bottom-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium leading-none">
                <MapPin className="size-2.5" />
                {image.pins.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <Dialog
        open={activeImage !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveIndex(null);
            setActivePinId(null);
            closePendingPin();
          }
        }}
      >
        <DialogPopup
          className="max-w-6xl border-0 bg-transparent p-0 shadow-none before:hidden"
          showCloseButton={false}
          bottomStickOnMobile={false}
        >
          {activeImage && (
            <div className="relative flex max-h-[90vh] items-center justify-center p-4">
              {images.length > 1 && (
                <button
                  type="button"
                  className="absolute left-6 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  onClick={() => {
                    setActivePinId(null);
                    closePendingPin();
                    setActiveIndex((index) =>
                      index !== null
                        ? (index - 1 + images.length) % images.length
                        : index,
                    );
                  }}
                  aria-label={t("tasks:gallery.previous")}
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}

              <div className="relative inline-block">
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: dropping a pin needs pointer coordinates — there's no keyboard equivalent for "this exact spot on the image" */}
                <img
                  src={activeImage.url}
                  alt={activeImage.filename}
                  onClick={handleImageClick}
                  className={`block max-h-[85vh] max-w-[85vw] rounded-xl border border-white/12 bg-black/30 object-contain shadow-2xl ${canAddPin ? "cursor-crosshair" : ""}`}
                />

                {pins.map((pin) => (
                  <button
                    key={pin.id}
                    type="button"
                    className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110 ${
                      pin.resolved ? "bg-muted-foreground/70" : "bg-warning"
                    } ${activePinId === pin.id ? "scale-110" : ""}`}
                    style={{
                      left: `${pin.xPercent}%`,
                      top: `${pin.yPercent}%`,
                      width: 16,
                      height: 16,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActivePinId((id) => (id === pin.id ? null : pin.id));
                    }}
                    aria-label={pin.content}
                  />
                ))}

                {pendingPin && (
                  <span
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-lg"
                    style={{
                      left: `${pendingPin.xPercent}%`,
                      top: `${pendingPin.yPercent}%`,
                      width: 16,
                      height: 16,
                    }}
                  />
                )}

                {activePinId &&
                  (() => {
                    const pin = pins.find((p) => p.id === activePinId);
                    if (!pin) return null;
                    return (
                      <div
                        className="absolute z-20 w-64 rounded-lg border border-border bg-popover p-3 shadow-xl"
                        style={{
                          left: `${pin.xPercent}%`,
                          top: `${pin.yPercent}%`,
                          transform: "translate(-50%, 12px)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {pin.clientName ||
                              t("tasks:gallery.pin.unknownAuthor")}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActivePinId(null)}
                            aria-label={t("tasks:gallery.pin.close")}
                          >
                            <X className="size-3.5 text-muted-foreground" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                          {pin.content}
                        </p>
                        {canManagePins && (
                          <div className="mt-2 flex items-center gap-2">
                            {onResolvePin && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[11px]"
                                onClick={() => onResolvePin(pin, !pin.resolved)}
                              >
                                {pin.resolved
                                  ? t("tasks:gallery.pin.reopen")
                                  : t("tasks:gallery.pin.resolve")}
                              </Button>
                            )}
                            {onDeletePin && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[11px] text-destructive"
                                onClick={() => {
                                  onDeletePin(pin);
                                  setActivePinId(null);
                                }}
                              >
                                {t("tasks:gallery.pin.delete")}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {pendingPin && (
                  <div
                    className="absolute z-20 w-64 rounded-lg border border-border bg-popover p-3 shadow-xl"
                    style={{
                      left: `${pendingPin.xPercent}%`,
                      top: `${pendingPin.yPercent}%`,
                      transform: "translate(-50%, 12px)",
                    }}
                  >
                    {requireNameForPin && (
                      <input
                        type="text"
                        value={pendingAuthorName}
                        onChange={(event) =>
                          setPendingAuthorName(event.target.value)
                        }
                        placeholder={t("tasks:gallery.pin.namePlaceholder")}
                        className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                      />
                    )}
                    <Textarea
                      value={pendingContent}
                      onChange={(event) =>
                        setPendingContent(event.target.value)
                      }
                      placeholder={t("tasks:gallery.pin.contentPlaceholder")}
                      className="min-h-16 text-xs"
                      autoFocus
                    />
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={closePendingPin}
                      >
                        {t("tasks:gallery.pin.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={handleSubmitPin}
                        disabled={isSubmittingPin}
                      >
                        {t("tasks:gallery.pin.submit")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <button
                  type="button"
                  className="absolute right-6 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  onClick={() => {
                    setActivePinId(null);
                    closePendingPin();
                    setActiveIndex((index) =>
                      index !== null ? (index + 1) % images.length : index,
                    );
                  }}
                  aria-label={t("tasks:gallery.next")}
                >
                  <ChevronRight className="size-5" />
                </button>
              )}
            </div>
          )}
        </DialogPopup>
      </Dialog>
    </section>
  );
}
