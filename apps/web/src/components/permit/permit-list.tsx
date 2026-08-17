import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useGetPermits from "@/hooks/queries/permit/use-get-permits";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { getInitials } from "@/lib/get-initials";
import PermitDetailPanel from "./permit-detail-panel";
import PermitForm from "./permit-form";
import { type PermitStatus, PermitStatusBadge } from "./permit-status-select";

type PermitListProps = {
  projectId: string;
  workspaceId: string;
};

export default function PermitList({
  projectId,
  workspaceId,
}: PermitListProps) {
  const { t } = useTranslation();
  const { data: permits = [], isLoading } = useGetPermits(projectId);
  const { canManagePermits } = useWorkspacePermission();
  const canEdit = canManagePermits();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null);

  const selectedPermit =
    permits.find((permit) => permit.id === selectedPermitId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-3 sm:px-4">
        <h1 className="text-sm font-semibold text-foreground">
          {t("permit:list.title", "Permits")}
        </h1>
        {canEdit && (
          <Button size="xs" onClick={() => setIsFormOpen(true)}>
            {t("permit:list.add", "New permit")}
          </Button>
        )}
      </div>

      {isLoading ? null : permits.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <h2 className="text-sm font-semibold text-foreground">
              {t("permit:list.empty", "No permits yet")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "permit:list.emptySubtitle",
                "Track municipal permit applications and their status.",
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("permit:list.number", "#")}</TableHead>
                <TableHead>
                  {t("permit:list.jurisdiction", "Jurisdiction")}
                </TableHead>
                <TableHead>{t("permit:list.type", "Type")}</TableHead>
                <TableHead>{t("permit:list.assignee", "Assignee")}</TableHead>
                <TableHead>
                  {t("permit:list.permitNumber", "Permit #")}
                </TableHead>
                <TableHead>{t("permit:list.status", "Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permits.map((permit) => (
                <TableRow key={permit.id}>
                  <TableCell className="text-muted-foreground">
                    PMT-{permit.number}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => setSelectedPermitId(permit.id)}
                    >
                      {permit.jurisdictionName}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {permit.permitType || "—"}
                  </TableCell>
                  <TableCell>
                    {permit.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="size-5">
                          <AvatarImage
                            src=""
                            alt={permit.assignee.name ?? ""}
                          />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(permit.assignee.name ?? "")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-muted-foreground text-sm">
                          {permit.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {permit.permitNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <PermitStatusBadge status={permit.status as PermitStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PermitForm
        projectId={projectId}
        workspaceId={workspaceId}
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {selectedPermit && (
        <PermitDetailPanel
          permit={selectedPermit}
          projectId={projectId}
          workspaceId={workspaceId}
          canEdit={canEdit}
          open={!!selectedPermit}
          onClose={() => setSelectedPermitId(null)}
        />
      )}
    </div>
  );
}
