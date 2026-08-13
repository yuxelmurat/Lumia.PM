import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import { getInitials } from "@/lib/get-initials";

export type PermitAssignee = { id: string; name: string | null };

type PermitAssigneePopoverProps = {
  workspaceId: string;
  assignee: PermitAssignee | null;
  onChange: (userId: string | null) => void;
  children: React.ReactNode;
};

export default function PermitAssigneePopover({
  workspaceId,
  assignee,
  onChange,
  children,
}: PermitAssigneePopoverProps) {
  const { t } = useTranslation();
  const { data: workspaceUsers } = useGetActiveWorkspaceUsers(workspaceId);
  const members = workspaceUsers?.members ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="max-h-64 space-y-1 overflow-y-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start gap-2 px-2"
            onClick={() => onChange(null)}
          >
            <div className="flex size-6 items-center justify-center rounded-full border border-border bg-muted">
              <span className="text-[10px] font-medium text-muted-foreground">
                ?
              </span>
            </div>
            <span className="text-sm">
              {t("permit:unassigned", "Unassigned")}
            </span>
            {!assignee && <Check className="ml-auto size-4" />}
          </Button>
          {members.map((member) => (
            <Button
              key={member.userId}
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start gap-2 px-2"
              onClick={() => onChange(member.userId)}
            >
              <Avatar className="size-6">
                <AvatarImage
                  src={member.user?.image ?? ""}
                  alt={member.user?.name ?? ""}
                />
                <AvatarFallback className="text-xs font-medium">
                  {getInitials(member.user?.name ?? "")}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{member.user?.name}</span>
              {assignee?.id === member.userId && (
                <Check className="ml-auto size-4 shrink-0" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
