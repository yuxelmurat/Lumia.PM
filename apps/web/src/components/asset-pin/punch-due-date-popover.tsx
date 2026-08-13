import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type PunchDueDatePopoverProps = {
  dueDate: string | Date | null;
  onChange: (dueDate: string | null) => void;
  children: React.ReactNode;
};

export default function PunchDueDatePopover({
  dueDate,
  onChange,
  children,
}: PunchDueDatePopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? date.toISOString() : null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Calendar
          mode="single"
          selected={dueDate ? new Date(dueDate) : undefined}
          onSelect={handleSelect}
          className="w-full bg-popover"
        />
        {dueDate && (
          <div className="border-t border-border pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => handleSelect(undefined)}
            >
              <X className="size-4" />
              {t("assetPins:punch.clearDueDate", "Clear date")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
