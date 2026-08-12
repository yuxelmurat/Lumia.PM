import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadApsViewerSdk } from "@/lib/aps-viewer-loader";
import type { AssetPin } from "./pin-overlay";

type ViewerPoint = { x: number; y: number; z: number };

export type DwgViewerState = { point: ViewerPoint };

type ViewerInstance = {
  start: () => void;
  tearDown?: () => void;
  finish?: () => void;
  container: HTMLElement;
  worldToClient: (point: ViewerPoint) => { x: number; y: number } | null;
  clientToWorld: (
    x: number,
    y: number,
    ignoreTransparent: boolean,
  ) => { point?: ViewerPoint } | null;
  loadDocumentNode: (doc: unknown, node: unknown) => void;
  addEventListener: (event: string, handler: () => void) => void;
  removeEventListener: (event: string, handler: () => void) => void;
};

const CAMERA_CHANGE_EVENT = "cameraChanged" as const;

type DwgViewerProps = {
  urn: string;
  getAccessToken: () => Promise<{ accessToken: string; expiresIn: number }>;
  pins: AssetPin[];
  selectedPinId: string | null;
  onSelectPin: (pinId: string | null) => void;
  onPlaceDraftPin: (state: DwgViewerState) => void;
  draftPoint: ViewerPoint | null;
  readOnly?: boolean;
};

export default function DwgViewer({
  urn,
  getAccessToken,
  pins,
  selectedPinId,
  onSelectPin,
  onPlaceDraftPin,
  draftPoint,
  readOnly = false,
}: DwgViewerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenPositions, setScreenPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  // Re-initializing on every render would tear down and rebuild WebGL
  // contexts constantly; getAccessToken is expected to be stable for the
  // lifetime of a given urn.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above.
  useEffect(() => {
    let cancelled = false;
    let viewer: ViewerInstance | null = null;

    async function init() {
      try {
        await loadApsViewerSdk();
        if (cancelled || !containerRef.current) return;

        const Autodesk = window.Autodesk;
        if (!Autodesk) throw new Error("Autodesk Viewer SDK failed to load");

        await new Promise<void>((resolve) => {
          Autodesk.Viewing.Initializer(
            {
              env: "AutodeskProduction2",
              api: "streamingV2",
              getAccessToken: (
                onSuccess: (token: string, expiresIn: number) => void,
              ) => {
                getAccessToken()
                  .then(({ accessToken, expiresIn }) =>
                    onSuccess(accessToken, expiresIn),
                  )
                  .catch(() => onSuccess("", 0));
              },
            },
            resolve,
          );
        });
        if (cancelled || !containerRef.current) return;

        viewer = new Autodesk.Viewing.GuiViewer3D(
          containerRef.current,
        ) as unknown as ViewerInstance;
        viewer.start();
        viewerRef.current = viewer;

        Autodesk.Viewing.Document.load(
          `urn:${urn}`,
          (doc) => {
            if (cancelled || !viewer) return;
            const docWithRoot = doc as {
              getRoot: () => { getDefaultGeometry: () => unknown };
            };
            const defaultGeometry = docWithRoot.getRoot().getDefaultGeometry();
            viewer.loadDocumentNode(doc, defaultGeometry);
            setReady(true);
          },
          (_code, message) => {
            if (!cancelled) setError(message);
          },
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load viewer",
          );
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      const current = viewerRef.current;
      viewerRef.current = null;
      current?.tearDown?.();
      current?.finish?.();
    };
  }, [urn]);

  // Reproject pins to screen space whenever the camera moves.
  useEffect(() => {
    if (!ready) return undefined;
    const viewer = viewerRef.current;
    if (!viewer) return undefined;

    const recomputePositions = () => {
      const next: Record<string, { x: number; y: number }> = {};
      for (const pin of pins) {
        const state = pin.viewerState as DwgViewerState | null;
        if (!state?.point) continue;
        const screen = viewer.worldToClient(state.point);
        if (screen) next[pin.id] = screen;
      }
      setScreenPositions(next);
    };

    recomputePositions();
    viewer.addEventListener(CAMERA_CHANGE_EVENT, recomputePositions);
    return () =>
      viewer.removeEventListener(CAMERA_CHANGE_EVENT, recomputePositions);
  }, [ready, pins]);

  useEffect(() => {
    if (readOnly || !ready) return undefined;
    const viewer = viewerRef.current;
    if (!viewer) return undefined;

    const handleClick = (event: MouseEvent) => {
      const rect = viewer.container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = viewer.clientToWorld(x, y, true);
      if (hit?.point) {
        onPlaceDraftPin({ point: hit.point });
      }
    };

    viewer.container.addEventListener("click", handleClick);
    return () => viewer.container.removeEventListener("click", handleClick);
  }, [ready, readOnly, onPlaceDraftPin]);

  const draftScreenPosition =
    draftPoint && viewerRef.current
      ? viewerRef.current.worldToClient(draftPoint)
      : null;

  return (
    <div className="relative h-[70vh] w-full min-w-[320px] overflow-hidden rounded-xl border border-border/60 bg-black/20">
      <div ref={containerRef} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-4 text-center text-destructive text-sm">
          {t(
            "assetPins:dwg.loadFailed",
            "Failed to load the DWG file: {{error}}",
            {
              error,
            },
          )}
        </div>
      )}
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          {t("assetPins:dwg.loadingViewer", "Loading 3D viewer…")}
        </div>
      )}
      {ready &&
        pins.map((pin) => {
          const position = screenPositions[pin.id];
          if (!position) return null;
          return (
            <button
              key={pin.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelectPin(pin.id === selectedPinId ? null : pin.id);
              }}
              className="-translate-x-1/2 -translate-y-1/2 absolute flex size-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-white shadow-lg"
              style={{ left: position.x, top: position.y }}
              aria-label={pin.label || pin.notes[0]?.content || "Pin"}
            />
          );
        })}
      {draftScreenPosition && (
        <div
          className="-translate-x-1/2 -translate-y-1/2 absolute flex size-6 animate-pulse items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg"
          style={{ left: draftScreenPosition.x, top: draftScreenPosition.y }}
        />
      )}
    </div>
  );
}
