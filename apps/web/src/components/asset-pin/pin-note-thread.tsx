import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import type { AssetPin } from "./pin-overlay";

function formatAuthor(author: AssetPin["author"]) {
  if (author.name) {
    return author.type === "guest" ? `${author.name} (client)` : author.name;
  }
  return author.type === "guest" ? "Client" : "Team member";
}

type PinNoteThreadProps = {
  pin: AssetPin;
  readOnly?: boolean;
  isSubmittingReply?: boolean;
  onReply: (content: string) => Promise<void> | void;
  isSubmittingStatus?: boolean;
  onToggleResolved?: () => Promise<void> | void;
};

export default function PinNoteThread({
  pin,
  readOnly = false,
  isSubmittingReply = false,
  onReply,
  isSubmittingStatus = false,
  onToggleResolved,
}: PinNoteThreadProps) {
  const { t } = useTranslation();
  const [reply, setReply] = useState("");

  const handleReply = async () => {
    if (!reply.trim()) return;
    await onReply(reply.trim());
    setReply("");
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-border/60 bg-card/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-medium text-xs",
            pin.status === "resolved"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          )}
        >
          {pin.status === "resolved"
            ? t("assetPins:status.resolved", "Resolved")
            : t("assetPins:status.open", "Open")}
        </span>
        {!readOnly && onToggleResolved && (
          <Button
            size="xs"
            variant="ghost"
            disabled={isSubmittingStatus}
            onClick={() => onToggleResolved()}
          >
            {pin.status === "resolved"
              ? t("assetPins:actions.reopen", "Reopen")
              : t("assetPins:actions.resolve", "Mark resolved")}
          </Button>
        )}
      </div>

      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {pin.notes.map((note) => (
          <div
            key={note.id}
            className="rounded-lg bg-muted/50 px-2.5 py-1.5 text-sm"
          >
            <div className="mb-0.5 font-medium text-muted-foreground text-xs">
              {formatAuthor(note.author)}
            </div>
            <div className="whitespace-pre-wrap break-words">
              {note.content}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder={t("assetPins:replyPlaceholder", "Reply…")}
            className="min-h-[3rem] resize-none text-sm"
          />
          <Button
            size="xs"
            variant="default"
            disabled={isSubmittingReply || !reply.trim()}
            onClick={handleReply}
            className="self-end"
          >
            {t("assetPins:actions.reply", "Reply")}
          </Button>
        </div>
      )}
    </div>
  );
}
