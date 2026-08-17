import { CalendarClock, Wrench } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { getInitials } from "@/lib/get-initials";
import type { AssetPin } from "./pin-overlay";
import PunchAssigneePopover from "./punch-assignee-popover";
import PunchDueDatePopover from "./punch-due-date-popover";

function formatAuthor(author: AssetPin["author"]) {
  if (author.name) {
    return author.type === "guest" ? `${author.name} (client)` : author.name;
  }
  return author.type === "guest" ? "Client" : "Team member";
}

type PunchMetaUpdate = {
  isPunchItem?: boolean;
  assigneeUserId?: string | null;
  dueDate?: string | null;
};

type PinNoteThreadProps = {
  pin: AssetPin;
  readOnly?: boolean;
  isSubmittingReply?: boolean;
  onReply: (content: string) => Promise<void> | void;
  isSubmittingStatus?: boolean;
  onToggleResolved?: () => Promise<void> | void;
  onAddAsMaterial?: () => void;
  workspaceId?: string;
  onUpdatePunchMeta?: (input: PunchMetaUpdate) => Promise<void> | void;
};

export default function PinNoteThread({
  pin,
  readOnly = false,
  isSubmittingReply = false,
  onReply,
  isSubmittingStatus = false,
  onToggleResolved,
  onAddAsMaterial,
  workspaceId,
  onUpdatePunchMeta,
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
        <div className="flex items-center gap-1">
          {!readOnly && onUpdatePunchMeta && (
            <Button
              size="xs"
              variant={pin.isPunchItem ? "secondary" : "outline"}
              onClick={() =>
                onUpdatePunchMeta({ isPunchItem: !pin.isPunchItem })
              }
            >
              <Wrench className="size-3.5" />
              {pin.isPunchItem
                ? t("assetPins:punch.unmark", "Unmark punch item")
                : t("assetPins:punch.mark", "Mark as punch item")}
            </Button>
          )}
          {!readOnly && onAddAsMaterial && (
            <Button size="xs" variant="outline" onClick={onAddAsMaterial}>
              {t("productSpec:pin.addAsMaterial", "Add as material")}
            </Button>
          )}
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
      </div>

      {pin.isPunchItem && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
          {!readOnly && onUpdatePunchMeta && workspaceId ? (
            <PunchAssigneePopover
              workspaceId={workspaceId}
              assignee={pin.assignee}
              onChange={(assigneeUserId) =>
                onUpdatePunchMeta({ assigneeUserId })
              }
            >
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs hover:bg-accent"
              >
                <Avatar className="size-5">
                  <AvatarImage src="" alt={pin.assignee?.name ?? ""} />
                  <AvatarFallback className="text-[10px]">
                    {pin.assignee ? getInitials(pin.assignee.name ?? "") : "?"}
                  </AvatarFallback>
                </Avatar>
                {pin.assignee?.name ??
                  t("assetPins:punch.unassigned", "Unassigned")}
              </button>
            </PunchAssigneePopover>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Avatar className="size-5">
                <AvatarFallback className="text-[10px]">
                  {pin.assignee ? getInitials(pin.assignee.name ?? "") : "?"}
                </AvatarFallback>
              </Avatar>
              {pin.assignee?.name ??
                t("assetPins:punch.unassigned", "Unassigned")}
            </span>
          )}
          {!readOnly && onUpdatePunchMeta ? (
            <PunchDueDatePopover
              dueDate={pin.dueDate}
              onChange={(dueDate) => onUpdatePunchMeta({ dueDate })}
            >
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground text-xs hover:bg-accent"
              >
                <CalendarClock className="size-3.5" />
                {pin.dueDate
                  ? new Date(pin.dueDate).toLocaleDateString()
                  : t("assetPins:punch.setDueDate", "Set due date")}
              </button>
            </PunchDueDatePopover>
          ) : (
            pin.dueDate && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <CalendarClock className="size-3.5" />
                {new Date(pin.dueDate).toLocaleDateString()}
              </span>
            )
          )}
        </div>
      )}

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
