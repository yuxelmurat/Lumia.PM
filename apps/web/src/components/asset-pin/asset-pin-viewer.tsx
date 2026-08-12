import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import useCreateAssetPin from "@/hooks/mutations/asset-pin/use-create-asset-pin";
import useCreateAssetPinNote from "@/hooks/mutations/asset-pin/use-create-asset-pin-note";
import useUpdateAssetPinStatus from "@/hooks/mutations/asset-pin/use-update-asset-pin-status";
import useGetAssetPins from "@/hooks/queries/asset-pin/use-get-asset-pins";
import { toast } from "@/lib/toast";
import PinNoteThread from "./pin-note-thread";
import PinOverlay, { type AssetPin } from "./pin-overlay";

type AssetPinViewerProps = {
  assetId: string;
  imageUrl: string;
  alt: string;
};

export default function AssetPinViewer({
  assetId,
  imageUrl,
  alt,
}: AssetPinViewerProps) {
  const { t } = useTranslation();
  const { data: pins = [] } = useGetAssetPins(assetId);
  const { mutateAsync: createPin, isPending: isCreatingPin } =
    useCreateAssetPin(assetId);
  const { mutateAsync: createNote, isPending: isCreatingNote } =
    useCreateAssetPinNote(assetId);
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateAssetPinStatus(assetId);

  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [draftPin, setDraftPin] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [draftContent, setDraftContent] = useState("");

  const typedPins = pins as AssetPin[];
  const selectedPin = typedPins.find((pin) => pin.id === selectedPinId) ?? null;

  const handlePlaceDraftPin = (draft: { x: number; y: number }) => {
    setSelectedPinId(null);
    setDraftPin(draft);
    setDraftContent("");
  };

  const handleSubmitDraft = async () => {
    if (!draftPin || !draftContent.trim()) return;
    try {
      await createPin({
        assetId,
        content: draftContent.trim(),
        x: draftPin.x,
        y: draftPin.y,
      });
      setDraftPin(null);
      setDraftContent("");
    } catch (error) {
      console.error("Failed to create asset pin:", error);
      toast.error(t("assetPins:failedToCreate", "Failed to add pin"));
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-start">
      <PinOverlay
        imageUrl={imageUrl}
        alt={alt}
        pins={typedPins}
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
              await createNote({ pinId: selectedPin.id, content });
            }}
            isSubmittingStatus={isUpdatingStatus}
            onToggleResolved={async () => {
              await updateStatus({
                pinId: selectedPin.id,
                status: selectedPin.status === "resolved" ? "open" : "resolved",
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
