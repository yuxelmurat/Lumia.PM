import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import useCreatePublicAssetPin from "@/hooks/mutations/public-asset/use-create-public-asset-pin";
import useCreatePublicAssetPinNote from "@/hooks/mutations/public-asset/use-create-public-asset-pin-note";
import { toast } from "@/lib/toast";
import PinNoteThread from "./pin-note-thread";
import PinOverlay, { type AssetPin } from "./pin-overlay";

type PublicAssetPinViewerProps = {
  token: string;
  guestId: string;
  imageUrl: string;
  alt: string;
  pins: AssetPin[];
};

export default function PublicAssetPinViewer({
  token,
  guestId,
  imageUrl,
  alt,
  pins,
}: PublicAssetPinViewerProps) {
  const { t } = useTranslation();
  const { mutateAsync: createPin, isPending: isCreatingPin } =
    useCreatePublicAssetPin(token);
  const { mutateAsync: createNote, isPending: isCreatingNote } =
    useCreatePublicAssetPinNote(token);

  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [draftPin, setDraftPin] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [draftContent, setDraftContent] = useState("");

  const selectedPin = pins.find((pin) => pin.id === selectedPinId) ?? null;

  const handlePlaceDraftPin = (draft: { x: number; y: number }) => {
    setSelectedPinId(null);
    setDraftPin(draft);
    setDraftContent("");
  };

  const handleSubmitDraft = async () => {
    if (!draftPin || !draftContent.trim()) return;
    try {
      await createPin({
        token,
        guestId,
        content: draftContent.trim(),
        x: draftPin.x,
        y: draftPin.y,
      });
      setDraftPin(null);
      setDraftContent("");
    } catch (error) {
      console.error("Failed to create public asset pin:", error);
      toast.error(t("assetPins:failedToCreate", "Failed to add pin"));
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-start">
      <PinOverlay
        imageUrl={imageUrl}
        alt={alt}
        pins={pins}
        selectedPinId={selectedPinId}
        onSelectPin={(id) => {
          setSelectedPinId(id);
          setDraftPin(null);
        }}
        draftPin={draftPin}
        onPlaceDraftPin={handlePlaceDraftPin}
      />
      <div className="flex w-full max-w-sm flex-col gap-3">
        {draftPin && (
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/70 p-3">
            <Textarea
              autoFocus
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              placeholder={t(
                "assetPins:newPinPlaceholder",
                "What should change here?",
              )}
              className="min-h-[4rem] resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setDraftPin(null)}
              >
                {t("common:actions.cancel", "Cancel")}
              </Button>
              <Button
                size="xs"
                variant="default"
                disabled={isCreatingPin || !draftContent.trim()}
                onClick={handleSubmitDraft}
              >
                {t("assetPins:actions.addPin", "Add pin")}
              </Button>
            </div>
          </div>
        )}
        {selectedPin && (
          <PinNoteThread
            pin={selectedPin}
            isSubmittingReply={isCreatingNote}
            onReply={async (content) => {
              await createNote({
                token,
                pinId: selectedPin.id,
                guestId,
                content,
              });
            }}
          />
        )}
        {!draftPin && !selectedPin && (
          <p className="text-muted-foreground text-sm">
            {t(
              "assetPins:clickToAnnotate",
              "Click anywhere on the image to leave a pin note.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
