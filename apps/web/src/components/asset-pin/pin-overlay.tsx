import { CheckCircle2, MessageCircle } from "lucide-react";
import { type MouseEvent, useRef } from "react";
import { cn } from "@/lib/cn";

export type AssetPinAuthor = {
  type: "user" | "guest";
  id: string;
  name: string | null;
};

export type AssetPinNote = {
  id: string;
  pinId: string;
  content: string;
  createdAt: string | Date;
  author: AssetPinAuthor;
};

export type AssetPin = {
  id: string;
  assetId: string;
  x: number | null;
  y: number | null;
  status: "open" | "resolved";
  label: string | null;
  createdAt: string | Date;
  author: AssetPinAuthor;
  notes: AssetPinNote[];
};

type DraftPin = { x: number; y: number };

type PinOverlayProps = {
  imageUrl: string;
  alt: string;
  pins: AssetPin[];
  selectedPinId: string | null;
  onSelectPin: (pinId: string | null) => void;
  draftPin: DraftPin | null;
  onPlaceDraftPin: (draft: DraftPin) => void;
  readOnly?: boolean;
  className?: string;
};

function PinDot({
  pin,
  selected,
  onSelect,
}: {
  pin: AssetPin;
  selected: boolean;
  onSelect: () => void;
}) {
  if (pin.x === null || pin.y === null) return null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={cn(
        "-translate-x-1/2 -translate-y-1/2 absolute flex size-6 items-center justify-center rounded-full border-2 border-white text-white shadow-lg transition-transform",
        pin.status === "resolved" ? "bg-emerald-500" : "bg-amber-500",
        selected ? "scale-125 ring-2 ring-white/80" : "hover:scale-110",
      )}
      style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
      aria-label={pin.label || pin.notes[0]?.content || "Pin"}
    >
      {pin.status === "resolved" ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <MessageCircle className="size-3.5" />
      )}
    </button>
  );
}

export default function PinOverlay({
  imageUrl,
  alt,
  pins,
  selectedPinId,
  onSelectPin,
  draftPin,
  onPlaceDraftPin,
  readOnly = false,
  className,
}: PinOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    onPlaceDraftPin({
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    });
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: pin placement is a pointer-coordinate interaction; existing pins stay keyboard-reachable via the PinDot buttons.
    // biome-ignore lint/a11y/useKeyWithClickEvents: no meaningful keyboard equivalent for picking a pixel; see above.
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        "relative inline-block max-h-[75vh] max-w-full overflow-hidden rounded-xl border border-border/60 bg-black/20",
        !readOnly && "cursor-crosshair",
        className,
      )}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="block max-h-[75vh] max-w-full select-none object-contain"
        draggable={false}
      />
      {pins.map((pin) => (
        <PinDot
          key={pin.id}
          pin={pin}
          selected={pin.id === selectedPinId}
          onSelect={() => onSelectPin(pin.id === selectedPinId ? null : pin.id)}
        />
      ))}
      {draftPin && (
        <div
          className="-translate-x-1/2 -translate-y-1/2 absolute flex size-6 animate-pulse items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg"
          style={{ left: `${draftPin.x * 100}%`, top: `${draftPin.y * 100}%` }}
        />
      )}
    </div>
  );
}
