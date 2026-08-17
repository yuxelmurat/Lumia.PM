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
import useGetRfis from "@/hooks/queries/rfi/use-get-rfis";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { getInitials } from "@/lib/get-initials";
import RfiDetailPanel from "./rfi-detail-panel";
import RfiForm from "./rfi-form";
import RfiStatusBadge, { type RfiStatus } from "./rfi-status-badge";

type RfiListProps = {
  projectId: string;
  workspaceId: string;
};

export default function RfiList({ projectId, workspaceId }: RfiListProps) {
  const { t } = useTranslation();
  const { data: rfis = [], isLoading } = useGetRfis(projectId);
  const { canManageRfis } = useWorkspacePermission();
  const canEdit = canManageRfis();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRfiId, setSelectedRfiId] = useState<string | null>(null);

  const selectedRfi = rfis.find((rfi) => rfi.id === selectedRfiId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-3 sm:px-4">
        <h1 className="text-sm font-semibold text-foreground">
          {t("rfi:list.title", "RFIs")}
        </h1>
        {canEdit && (
          <Button size="xs" onClick={() => setIsFormOpen(true)}>
            {t("rfi:list.add", "New RFI")}
          </Button>
        )}
      </div>

      {isLoading ? null : rfis.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <h2 className="text-sm font-semibold text-foreground">
              {t("rfi:list.empty", "No RFIs yet")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "rfi:list.emptySubtitle",
                "Track formal questions to the design team and their answers.",
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("rfi:list.number", "#")}</TableHead>
                <TableHead>{t("rfi:list.subject", "Subject")}</TableHead>
                <TableHead>{t("rfi:list.assignee", "Assignee")}</TableHead>
                <TableHead>{t("rfi:list.dueDate", "Due date")}</TableHead>
                <TableHead>{t("rfi:list.status", "Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfis.map((rfi) => (
                <TableRow key={rfi.id}>
                  <TableCell className="text-muted-foreground">
                    RFI-{rfi.number}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => setSelectedRfiId(rfi.id)}
                    >
                      {rfi.subject}
                    </button>
                  </TableCell>
                  <TableCell>
                    {rfi.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="size-5">
                          <AvatarImage src="" alt={rfi.assignee.name ?? ""} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(rfi.assignee.name ?? "")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-muted-foreground text-sm">
                          {rfi.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {rfi.dueDate
                      ? new Date(rfi.dueDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <RfiStatusBadge status={rfi.status as RfiStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RfiForm
        projectId={projectId}
        workspaceId={workspaceId}
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {selectedRfi && (
        <RfiDetailPanel
          rfi={selectedRfi}
          projectId={projectId}
          workspaceId={workspaceId}
          canEdit={canEdit}
          open={!!selectedRfi}
          onClose={() => setSelectedRfiId(null)}
        />
      )}
    </div>
  );
}
