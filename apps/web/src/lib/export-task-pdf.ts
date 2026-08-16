import { jsPDF } from "jspdf";
import type { TaskApproval } from "@/types/task";
import { INTER_BOLD_BASE64 } from "./fonts/inter-pdf-bold";
import { INTER_REGULAR_BASE64 } from "./fonts/inter-pdf-regular";
import { formatDateTime } from "./format";

/**
 * Rough markdown-to-plain-text pass for the PDF body — good enough for a
 * printed summary, not a full markdown renderer. Strips the syntax that
 * would otherwise show up literally (##, **, `, list markers, links).
 */
function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/<kaneo-image[^>]*\/?>/g, "[image attached]")
    .replace(/<kaneo-attachment[^>]*\/?>/g, "[file attached]")
    .replace(/<kaneo-embed[^>]*\/?>/g, "[embedded link]")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "[image attached]")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*>\s?/gm, "")
    .trim();
}

export type TaskPdfWorkspaceInfo = {
  name: string;
  logo?: string | null;
  legalName?: string;
  address?: string;
  taxId?: string;
  phone?: string;
  contactEmail?: string;
};

export type TaskPdfInput = {
  task: {
    title: string;
    number: number | null;
    description: string | null;
    approvalStatus?: string | null;
    approvals?: TaskApproval[];
  };
  projectName: string;
  workspace: TaskPdfWorkspaceInfo;
  labels?: string[];
  strings: {
    documentTitle: string;
    project: string;
    status: string;
    statusApproved: string;
    statusChangesRequested: string;
    statusPending: string;
    description: string;
    approvalHistory: string;
    noApprovals: string;
    respondedOn: string;
    generatedOn: string;
  };
};

const PAGE_MARGIN = 48;
const PAGE_WIDTH = 595.28; // A4 in points

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  let cursorY = y;
  for (const line of lines) {
    doc.text(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

export function exportTaskApprovalPdf({
  task,
  projectName,
  workspace,
  labels = [],
  strings,
}: TaskPdfInput): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const contentWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  // jsPDF only ships Latin-1 core fonts (Helvetica etc.) — Turkish
  // characters like ı, İ, ğ, ş fall back to tofu boxes on those. Inter
  // (Latin + Latin Extended-A) is embedded instead so this renders
  // correctly for the studios this product is actually built for.
  doc.addFileToVFS("Inter-Regular.ttf", INTER_REGULAR_BASE64);
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");
  doc.addFileToVFS("Inter-Bold.ttf", INTER_BOLD_BASE64);
  doc.addFont("Inter-Bold.ttf", "Inter", "bold");

  doc.setFont("Inter", "bold");
  doc.setFontSize(16);
  doc.text(workspace.name || strings.documentTitle, PAGE_MARGIN, y);
  y += 24;

  doc.setFont("Inter", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `${strings.generatedOn}: ${formatDateTime(new Date().toISOString())}`,
    PAGE_MARGIN,
    y,
  );
  y += 24;
  doc.setTextColor(20, 20, 20);

  doc.setDrawColor(220, 220, 220);
  doc.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y);
  y += 24;

  doc.setFont("Inter", "bold");
  doc.setFontSize(18);
  y = addWrappedText(
    doc,
    task.number ? `#${task.number} — ${task.title}` : task.title,
    PAGE_MARGIN,
    y,
    contentWidth,
    22,
  );
  y += 6;

  doc.setFont("Inter", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(`${strings.project}: ${projectName}`, PAGE_MARGIN, y);
  y += 16;

  const statusLabel =
    task.approvalStatus === "approved"
      ? strings.statusApproved
      : task.approvalStatus === "changes_requested"
        ? strings.statusChangesRequested
        : strings.statusPending;
  doc.text(`${strings.status}: ${statusLabel}`, PAGE_MARGIN, y);
  y += 16;

  if (labels.length > 0) {
    doc.text(labels.join(", "), PAGE_MARGIN, y);
    y += 16;
  }
  doc.setTextColor(20, 20, 20);
  y += 8;

  if (task.description) {
    doc.setFont("Inter", "bold");
    doc.setFontSize(12);
    doc.text(strings.description, PAGE_MARGIN, y);
    y += 18;

    doc.setFont("Inter", "normal");
    doc.setFontSize(10.5);
    y = addWrappedText(
      doc,
      markdownToPlainText(task.description),
      PAGE_MARGIN,
      y,
      contentWidth,
      14,
    );
    y += 16;
  }

  doc.setFont("Inter", "bold");
  doc.setFontSize(12);
  doc.text(strings.approvalHistory, PAGE_MARGIN, y);
  y += 18;

  doc.setFont("Inter", "normal");
  doc.setFontSize(10.5);

  const approvals = task.approvals ?? [];
  if (approvals.length === 0) {
    doc.setTextColor(110, 110, 110);
    doc.text(strings.noApprovals, PAGE_MARGIN, y);
    doc.setTextColor(20, 20, 20);
    y += 16;
  } else {
    for (const approval of approvals) {
      if (y > 760) {
        doc.addPage();
        y = PAGE_MARGIN;
      }
      const approvalStatusLabel =
        approval.status === "approved"
          ? strings.statusApproved
          : strings.statusChangesRequested;
      doc.setFont("Inter", "bold");
      doc.text(
        `${approval.clientName} — ${approvalStatusLabel}`,
        PAGE_MARGIN,
        y,
      );
      y += 14;
      doc.setFont("Inter", "normal");
      doc.setTextColor(110, 110, 110);
      doc.text(
        `${strings.respondedOn}: ${formatDateTime(approval.respondedAt)}`,
        PAGE_MARGIN,
        y,
      );
      doc.setTextColor(20, 20, 20);
      y += 14;
      if (approval.note) {
        y = addWrappedText(
          doc,
          approval.note,
          PAGE_MARGIN,
          y,
          contentWidth,
          13,
        );
      }
      y += 12;
    }
  }

  const hasCompanyProfile =
    workspace.legalName ||
    workspace.address ||
    workspace.taxId ||
    workspace.phone ||
    workspace.contactEmail;

  if (hasCompanyProfile) {
    doc.setDrawColor(220, 220, 220);
    doc.line(PAGE_MARGIN, 800, PAGE_WIDTH - PAGE_MARGIN, 800);
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    const footerParts = [
      workspace.legalName,
      workspace.address,
      workspace.taxId,
      workspace.phone,
      workspace.contactEmail,
    ].filter(Boolean);
    doc.text(footerParts.join("  ·  "), PAGE_MARGIN, 815, {
      maxWidth: contentWidth,
    });
  }

  const filenameBase = task.number
    ? `task-${task.number}-approval`
    : "task-approval";
  doc.save(`${filenameBase}.pdf`);
}
