import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { History, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { escapeHtml, isValidUrl } from "./url-safety";

export type AssetVersion = {
  id: string;
  url: string;
  filename: string;
  versionNumber: number;
  createdAt: string;
};

export type VersionedImageOptions = {
  taskId: string;
  surface: "description" | "comment";
  uploadNewVersion: (args: {
    taskId: string;
    surface: "description" | "comment";
    file: File;
    previousAssetId: string;
  }) => Promise<{ url: string; assetId?: string; versionNumber?: number }>;
  getVersions: (args: {
    taskId: string;
    assetId: string;
  }) => Promise<AssetVersion[]>;
  i18nPrefix: string;
};

function VersionedImageView({
  node,
  updateAttributes,
  extension,
  editor,
}: NodeViewProps) {
  const { t } = useTranslation();
  const options = extension.options as VersionedImageOptions;
  const rawSrc = String(node.attrs.src || "");
  const src = isValidUrl(rawSrc) ? rawSrc : "";
  const alt = String(node.attrs.alt || "");
  const assetId = node.attrs.assetId ? String(node.attrs.assetId) : null;
  const versionNumber = Number(node.attrs.versionNumber || 1);
  // Read-only surfaces (the public client-facing project page, activity
  // previews) reuse this same editor in `readOnly` mode. Clients must never
  // be able to overwrite a studio's render from there.
  const canManageVersions = editor.isEditable;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [versions, setVersions] = useState<AssetVersion[] | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [uploading, setUploading] = useState(false);

  const p = (key: string) => `${options.i18nPrefix}.${key}`;

  const handleFilePicked = async (file: File | undefined | null) => {
    if (!file || !assetId) return;
    setUploading(true);
    try {
      const result = await options.uploadNewVersion({
        taskId: options.taskId,
        surface: options.surface,
        file,
        previousAssetId: assetId,
      });
      updateAttributes({
        src: result.url,
        assetId: result.assetId ?? assetId,
        versionNumber: result.versionNumber ?? versionNumber + 1,
      });
      setVersions(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleHistory = async () => {
    if (versions) {
      setVersions(null);
      return;
    }
    if (!assetId) return;
    setLoadingVersions(true);
    try {
      const list = await options.getVersions({
        taskId: options.taskId,
        assetId,
      });
      setVersions(list);
    } finally {
      setLoadingVersions(false);
    }
  };

  return (
    <NodeViewWrapper
      as="span"
      className="kaneo-versioned-image group/kvi relative inline-block align-top max-w-full"
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="kaneo-editor-image"
        />
      ) : null}
      {assetId ? (
        <span
          className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover/kvi:opacity-100 focus-within:opacity-100 transition-opacity"
          contentEditable={false}
        >
          {versionNumber > 1 ? (
            <span className="px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium leading-none">
              {t(p("version.badge"), { number: versionNumber })}
            </span>
          ) : null}
          {canManageVersions ? (
            <button
              type="button"
              className="p-1 rounded bg-black/70 text-white hover:bg-black/90 disabled:opacity-60"
              title={t(p("version.uploadNew"))}
              aria-label={t(p("version.uploadNew"))}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <UploadCloud className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            className="p-1 rounded bg-black/70 text-white hover:bg-black/90"
            title={t(p("version.history"))}
            aria-label={t(p("version.history"))}
            onClick={toggleHistory}
          >
            <History className="size-3.5" />
          </button>
          {canManageVersions ? (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFilePicked(event.target.files?.[0])}
            />
          ) : null}
        </span>
      ) : null}
      {versions ? (
        <span
          className="absolute top-9 right-1.5 z-20 flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border border-border bg-popover p-2 shadow-md"
          contentEditable={false}
        >
          {loadingVersions ? (
            <span className="px-1 text-xs text-muted-foreground">
              {t(p("version.loading"))}
            </span>
          ) : (
            versions
              .slice()
              .sort((a, b) => b.versionNumber - a.versionNumber)
              .map((version) => (
                <button
                  key={version.id}
                  type="button"
                  className={`flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-accent ${
                    version.id === assetId ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    updateAttributes({
                      src: version.url,
                      assetId: version.id,
                      versionNumber: version.versionNumber,
                    });
                    setVersions(null);
                  }}
                >
                  <img
                    src={version.url}
                    alt=""
                    className="size-8 shrink-0 rounded border border-border object-cover"
                  />
                  <span>
                    {t(p("version.badge"), { number: version.versionNumber })}
                  </span>
                </button>
              ))
          )}
        </span>
      ) : null}
    </NodeViewWrapper>
  );
}

export const VersionedImage = Node.create<VersionedImageOptions>({
  name: "versionedImage",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      taskId: "",
      surface: "description",
      uploadNewVersion: async () => {
        throw new Error("uploadNewVersion is not configured");
      },
      getVersions: async () => [],
      i18nPrefix: "tasks:detail.editor",
    };
  },

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      assetId: { default: null },
      versionNumber: { default: 1 },
    };
  },

  parseHTML() {
    return [
      {
        tag: "kaneo-image[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          return {
            src: element.getAttribute("src") || "",
            alt: element.getAttribute("alt") || "",
            assetId: element.getAttribute("asset-id") || null,
            versionNumber: Number(element.getAttribute("version") || 1),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "kaneo-image",
      mergeAttributes(HTMLAttributes, {
        "data-type": "kaneo-image",
        src: HTMLAttributes.src,
        alt: HTMLAttributes.alt,
        "asset-id": HTMLAttributes.assetId,
        version: HTMLAttributes.versionNumber,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VersionedImageView);
  },

  renderMarkdown(
    node: {
      attrs?: {
        src?: string;
        alt?: string;
        assetId?: string | null;
        versionNumber?: number;
      };
    },
    _helpers: unknown,
    _context: unknown,
  ) {
    const src = String(node.attrs?.src || "");
    const alt = String(node.attrs?.alt || "");
    const assetId = node.attrs?.assetId ? String(node.attrs.assetId) : "";
    const versionNumber = Number(node.attrs?.versionNumber || 1);

    if (!src) return "";
    if (!assetId) {
      return `\n![${escapeHtml(alt)}](${escapeHtml(src)})\n`;
    }

    return `\n<kaneo-image src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" asset-id="${escapeHtml(assetId)}" version="${versionNumber}" />\n`;
  },
});
