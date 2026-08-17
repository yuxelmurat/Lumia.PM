// Loads the Autodesk Platform Services (APS) Viewer SDK from Autodesk's CDN
// on demand. There is no first-party npm package for the viewer bundle
// itself; Autodesk's own samples load it as a global script + stylesheet.
const VIEWER_JS_URL =
  "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js";
const VIEWER_CSS_URL =
  "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css";

declare global {
  interface Window {
    Autodesk?: {
      Viewing: {
        Initializer: (
          options: Record<string, unknown>,
          onSuccess: () => void,
        ) => void;
        shutdown?: () => void;
        GuiViewer3D: new (container: HTMLElement) => unknown;
        Document: {
          load: (
            documentId: string,
            onSuccess: (doc: unknown) => void,
            onFailure: (code: number, message: string) => void,
          ) => void;
        };
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

function loadStylesheet(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.Autodesk?.Viewing) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Autodesk Viewer SDK")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Autodesk Viewer SDK"));
    document.head.appendChild(script);
  });
}

export function loadApsViewerSdk(): Promise<void> {
  if (!loadPromise) {
    loadStylesheet(VIEWER_CSS_URL);
    loadPromise = loadScript(VIEWER_JS_URL);
  }
  return loadPromise;
}
