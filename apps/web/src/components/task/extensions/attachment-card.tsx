import { mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Box, FileText } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import DwgPinViewer from "@/components/asset-pin/dwg-pin-viewer";
import ShareLinkManager from "@/components/asset-pin/share-link-manager";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import { escapeHtml, isValidUrl } from "./url-safety";

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isDwgFilename(filename: string) {
  return filename.toLowerCase().endsWith(".dwg");
}

function extractAssetId(url: string) {
  return url.match(/\/asset\/([^/?]+)/)?.[1] ?? null;
}

function AttachmentCardView({ node }: NodeViewProps) {
  const { t } = useTranslation();
  const rawUrl = String(node.attrs.url || "");
  const url = isValidUrl(rawUrl) ? rawUrl : "";
  const filename = String(node.attrs.filename || "Attachment");
  const mimeType = String(node.attrs.mimeType || "");
  const size = Number(node.attrs.size || 0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const assetId = url ? extractAssetId(url) : null;
  const isDwg = isDwgFilename(filename);

  return (
    <NodeViewWrapper as="span" className="kaneo-attachment-node">
      {isDwg && assetId ? (
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="kaneo-attachment-card"
          title={filename}
        >
          <span className="kaneo-attachment-card-icon">
            <Box className="size-4" />
          </span>
          <span className="kaneo-attachment-card-content">
            <span className="kaneo-attachment-card-title">{filename}</span>
            <span className="kaneo-attachment-card-meta">
              {t("assetPins:dwg.viewAndAnnotate", "View & annotate")}
            </span>
          </span>
        </button>
      ) : (
        <a
          href={url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="kaneo-attachment-card"
          title={filename}
        >
          <span className="kaneo-attachment-card-icon">
            <FileText className="size-4" />
          </span>
          <span className="kaneo-attachment-card-content">
            <span className="kaneo-attachment-card-title">{filename}</span>
            <span className="kaneo-attachment-card-meta">
              {formatBytes(size)}
              {mimeType ? ` · ${mimeType}` : ""}
            </span>
          </span>
        </a>
      )}
      {isDwg && assetId && (
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogPopup
            className="max-w-6xl border-0 bg-transparent p-0 shadow-none before:hidden"
            showCloseButton={false}
            bottomStickOnMobile={false}
          >
            <div className="flex max-h-[90vh] flex-col gap-3 p-4">
              <DwgPinViewer assetId={assetId} />
              <ShareLinkManager assetId={assetId} />
            </div>
          </DialogPopup>
        </Dialog>
      )}
    </NodeViewWrapper>
  );
}

export const AttachmentCard = Node.create({
  name: "attachmentCard",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      url: { default: "" },
      filename: { default: "" },
      mimeType: { default: "" },
      size: { default: 0 },
    };
  },

  parseHTML() {
    return [
      { tag: "kaneo-attachment[url]" },
      { tag: "span[data-type='attachment-card'][data-url]" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "kaneo-attachment",
      mergeAttributes(HTMLAttributes, {
        "data-type": "attachment-card",
        "data-url": HTMLAttributes.url,
        "data-filename": HTMLAttributes.filename,
        "data-mime-type": HTMLAttributes.mimeType,
        "data-size": HTMLAttributes.size,
        url: HTMLAttributes.url,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentCardView);
  },

  renderMarkdown(
    node: {
      attrs?: {
        url?: string;
        filename?: string;
        mimeType?: string;
        size?: number;
      };
    },
    _helpers: unknown,
    _context: unknown,
  ) {
    const url = String(node.attrs?.url || "");
    const filename = String(node.attrs?.filename || "");
    const mimeType = String(node.attrs?.mimeType || "");
    const size = Number(node.attrs?.size || 0);

    if (!url) return "";

    return `\n<kaneo-attachment url="${escapeHtml(url)}" filename="${escapeHtml(filename)}" mime-type="${escapeHtml(mimeType)}" size="${size}" />\n`;
  },
});
