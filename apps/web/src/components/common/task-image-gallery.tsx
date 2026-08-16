import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import type { TaskImage } from "@/types/task";

type TaskImageGalleryProps = {
  images: TaskImage[];
};

export function TaskImageGallery({ images }: TaskImageGalleryProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
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
  }, [activeIndex, images.length]);

  if (images.length === 0) return null;

  const activeImage = activeIndex !== null ? images[activeIndex] : null;

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
          </button>
        ))}
      </div>

      <Dialog
        open={activeImage !== null}
        onOpenChange={(open) => {
          if (!open) setActiveIndex(null);
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
                  onClick={() =>
                    setActiveIndex((index) =>
                      index !== null
                        ? (index - 1 + images.length) % images.length
                        : index,
                    )
                  }
                  aria-label={t("tasks:gallery.previous")}
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}
              <img
                src={activeImage.url}
                alt={activeImage.filename}
                className="max-h-[85vh] max-w-[85vw] rounded-xl border border-white/12 bg-black/30 object-contain shadow-2xl"
              />
              {images.length > 1 && (
                <button
                  type="button"
                  className="absolute right-6 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  onClick={() =>
                    setActiveIndex((index) =>
                      index !== null ? (index + 1) % images.length : index,
                    )
                  }
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
