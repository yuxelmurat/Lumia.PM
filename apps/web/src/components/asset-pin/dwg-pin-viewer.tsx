import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import getAssetViewerToken from "@/fetchers/asset-aps/get-viewer-token";
import useTranslateAsset from "@/hooks/mutations/asset-aps/use-translate-asset";
import useCreateAssetPin from "@/hooks/mutations/asset-pin/use-create-asset-pin";
import useCreateAssetPinNote from "@/hooks/mutations/asset-pin/use-create-asset-pin-note";
import useUpdateAssetPinStatus from "@/hooks/mutations/asset-pin/use-update-asset-pin-status";
import useGetAssetTranslationStatus from "@/hooks/queries/asset-aps/use-get-asset-translation-status";
import useGetAssetPins from "@/hooks/queries/asset-pin/use-get-asset-pins";
import { toast } from "@/lib/toast";
import type { DwgViewerState } from "./dwg-viewer";
import DwgViewer from "./dwg-viewer";
import PinNoteThread from "./pin-note-thread";
import type { AssetPin } from "./pin-overlay";

type DwgPinViewerProps = {
  assetId: string;
};

export default function DwgPinViewer({ assetId }: DwgPinViewerProps) {
  const { t } = useTranslation();
  const { data: status } = useGetAssetTranslationStatus(assetId);
  const { mutateAsync: translate, isPending: isTranslating } =
    useTranslateAsset(assetId);
  const { data: pins = [] } = useGetAssetPins(assetId);
  const { mutateAsync: createPin, isPending: isCreatingPin } =
    useCreateAssetPin(assetId);
  const { mutateAsync: createNote, isPending: isCreatingNote } =
    useCreateAssetPinNote(assetId);
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateAssetPinStatus(assetId);

  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [draftPoint, setDraftPoint] = useState<DwgViewerState["point"] | null>(
    null,
  );
  const [draftContent, setDraftContent] = useState("");

  const typedPins = pins as AssetPin[];
  const selectedPin = typedPins.find((pin) => pin.id === selectedPinId) ?? null;

  const handleTranslate = async () => {
    try {
      await translate();
    } catch (error) {
      console.error("Failed to submit DWG for translation:", error);
      toast.error(
        t("assetPins:dwg.translateFailed", "Failed to submit for viewing"),
      );
    }
  };

  const handleSubmitDraft = async () => {
    if (!draftPoint || !draftContent.trim()) return;
    try {
      await createPin({
        assetId,
        content: draftContent.trim(),
        viewerState: { point: draftPoint },
      });
      setDraftPoint(null);
      setDraftContent("");
    } catch (error) {
      console.error("Failed to create DWG pin:", error);
      toast.error(t("assetPins:failedToCreate", "Failed to add pin"));
    }
  };

  if (!status || status.status === "pending") {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-card/70">
        <p className="text-muted-foreground text-sm">
          {t(
            "assetPins:dwg.notTranslated",
            "This DWG hasn't been prepared for viewing yet.",
          )}
        </p>
        <Button disabled={isTranslating} onClick={handleTranslate}>
          {t("assetPins:dwg.translate", "Prepare for viewing")}
        </Button>
      </div>
    );
  }

  if (status.status === "inprogress") {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center rounded-xl border border-border/60 bg-card/70">
        <p className="text-muted-foreground text-sm">
          {t("assetPins:dwg.translating", "Preparing the DWG for viewing…")}
        </p>
      </div>
    );
  }

  if (status.status === "failed" || status.status === "timeout") {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-card/70">
        <p className="text-destructive text-sm">
          {t("assetPins:dwg.translationFailed", "Preparing this DWG failed.")}
        </p>
        <Button disabled={isTranslating} onClick={handleTranslate}>
          {t("assetPins:dwg.retry", "Retry")}
        </Button>
      </div>
    );
  }

  if (!status.urn) return null;

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-start">
      <DwgViewer
        urn={status.urn}
        getAccessToken={() => getAssetViewerToken(assetId)}
        pins={typedPins}
        selectedPinId={selectedPinId}
        onSelectPin={(id) => {
          setSelectedPinId(id);
          setDraftPoint(null);
        }}
        draftPoint={draftPoint}
        onPlaceDraftPin={(state) => {
          setSelectedPinId(null);
          setDraftPoint(state.point);
          setDraftContent("");
        }}
      />
      <div className="flex w-full max-w-sm flex-col gap-3">
        {draftPoint && (
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
                onClick={() => setDraftPoint(null)}
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
        {!draftPoint && !selectedPin && (
          <p className="text-muted-foreground text-sm">
            {t(
              "assetPins:clickToAnnotate",
              "Click anywhere on the model to leave a pin note.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
