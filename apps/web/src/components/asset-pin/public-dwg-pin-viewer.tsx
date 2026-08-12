import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import getPublicAssetViewerToken from "@/fetchers/public-asset/get-public-asset-viewer-token";
import useCreatePublicAssetPin from "@/hooks/mutations/public-asset/use-create-public-asset-pin";
import useCreatePublicAssetPinNote from "@/hooks/mutations/public-asset/use-create-public-asset-pin-note";
import useGetPublicAssetTranslationStatus from "@/hooks/queries/public-asset/use-get-public-asset-translation-status";
import { toast } from "@/lib/toast";
import type { DwgViewerState } from "./dwg-viewer";
import DwgViewer from "./dwg-viewer";
import PinNoteThread from "./pin-note-thread";
import type { AssetPin } from "./pin-overlay";

type PublicDwgPinViewerProps = {
  token: string;
  guestId: string;
  pins: AssetPin[];
};

export default function PublicDwgPinViewer({
  token,
  guestId,
  pins,
}: PublicDwgPinViewerProps) {
  const { t } = useTranslation();
  const { data: status } = useGetPublicAssetTranslationStatus(token);
  const { mutateAsync: createPin, isPending: isCreatingPin } =
    useCreatePublicAssetPin(token);
  const { mutateAsync: createNote, isPending: isCreatingNote } =
    useCreatePublicAssetPinNote(token);

  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [draftPoint, setDraftPoint] = useState<DwgViewerState["point"] | null>(
    null,
  );
  const [draftContent, setDraftContent] = useState("");

  const selectedPin = pins.find((pin) => pin.id === selectedPinId) ?? null;

  const handleSubmitDraft = async () => {
    if (!draftPoint || !draftContent.trim()) return;
    try {
      await createPin({
        token,
        guestId,
        content: draftContent.trim(),
        viewerState: { point: draftPoint },
      });
      setDraftPoint(null);
      setDraftContent("");
    } catch (error) {
      console.error("Failed to create public DWG pin:", error);
      toast.error(t("assetPins:failedToCreate", "Failed to add pin"));
    }
  };

  if (
    !status ||
    status.status === "pending" ||
    status.status === "inprogress"
  ) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center rounded-xl border border-border/60 bg-card/70">
        <p className="text-muted-foreground text-sm">
          {t(
            "assetPins:dwg.notReadyForGuest",
            "This file isn't ready to view yet — check back shortly.",
          )}
        </p>
      </div>
    );
  }

  if (
    status.status === "failed" ||
    status.status === "timeout" ||
    !status.urn
  ) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center rounded-xl border border-border/60 bg-card/70">
        <p className="text-destructive text-sm">
          {t("assetPins:dwg.translationFailed", "Preparing this DWG failed.")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-start">
      <DwgViewer
        urn={status.urn}
        getAccessToken={() => getPublicAssetViewerToken(token)}
        pins={pins}
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
              await createNote({
                token,
                pinId: selectedPin.id,
                guestId,
                content,
              });
            }}
          />
        )}
        {!draftPoint && !selectedPin && (
          <p className="text-muted-foreground text-sm">
            {t(
              "assetPins:clickToAnnotate",
              "Click anywhere to leave a pin note.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
