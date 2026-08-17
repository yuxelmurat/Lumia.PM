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
import useGetSubmittals from "@/hooks/queries/submittal/use-get-submittals";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { getInitials } from "@/lib/get-initials";
import SubmittalDetailPanel from "./submittal-detail-panel";
import SubmittalForm from "./submittal-form";
import SubmittalStatusBadge, {
  type SubmittalStatus,
} from "./submittal-status-badge";

type SubmittalListProps = {
  projectId: string;
  workspaceId: string;
};

type Submittal = NonNullable<
  ReturnType<typeof useGetSubmittals>["data"]
>[number];

export default function SubmittalList({
  projectId,
  workspaceId,
}: SubmittalListProps) {
  const { t } = useTranslation();
  const { data: submittals = [], isLoading } = useGetSubmittals(projectId);
  const { canManageSubmittals } = useWorkspacePermission();
  const canEdit = canManageSubmittals();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<{
    title: string;
    specSection: string | null;
    supersedesSubmittalId: string;
  } | null>(null);
  const [selectedSubmittalId, setSelectedSubmittalId] = useState<string | null>(
    null,
  );

  const selectedSubmittal =
    submittals.find((submittal) => submittal.id === selectedSubmittalId) ??
    null;

  const openCreateForm = () => {
    setPrefill(null);
    setIsFormOpen(true);
  };

  const handleResubmit = (submittal: Submittal) => {
    setSelectedSubmittalId(null);
    setPrefill({
      title: submittal.title,
      specSection: submittal.specSection,
      supersedesSubmittalId: submittal.id,
    });
    setIsFormOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-3 sm:px-4">
        <h1 className="text-sm font-semibold text-foreground">
          {t("submittal:list.title", "Submittals")}
        </h1>
        {canEdit && (
          <Button size="xs" onClick={openCreateForm}>
            {t("submittal:list.add", "New submittal")}
          </Button>
        )}
      </div>

      {isLoading ? null : submittals.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <h2 className="text-sm font-semibold text-foreground">
              {t("submittal:list.empty", "No submittals yet")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "submittal:list.emptySubtitle",
                "Track documents sent for review and their decisions.",
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("submittal:list.number", "#")}</TableHead>
                <TableHead>{t("submittal:list.title2", "Title")}</TableHead>
                <TableHead>
                  {t("submittal:list.specSection", "Spec section")}
                </TableHead>
                <TableHead>
                  {t("submittal:list.assignee", "Assignee")}
                </TableHead>
                <TableHead>{t("submittal:list.dueDate", "Due date")}</TableHead>
                <TableHead>{t("submittal:list.status", "Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submittals.map((submittal) => (
                <TableRow key={submittal.id}>
                  <TableCell className="text-muted-foreground">
                    SUB-{submittal.number}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => setSelectedSubmittalId(submittal.id)}
                    >
                      {submittal.title}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {submittal.specSection ?? "—"}
                  </TableCell>
                  <TableCell>
                    {submittal.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="size-5">
                          <AvatarImage
                            src=""
                            alt={submittal.assignee.name ?? ""}
                          />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(submittal.assignee.name ?? "")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-muted-foreground text-sm">
                          {submittal.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {submittal.dueDate
                      ? new Date(submittal.dueDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <SubmittalStatusBadge
                      status={submittal.status as SubmittalStatus}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SubmittalForm
        projectId={projectId}
        workspaceId={workspaceId}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setPrefill(null);
        }}
        prefill={prefill}
      />

      {selectedSubmittal && (
        <SubmittalDetailPanel
          submittal={selectedSubmittal}
          projectId={projectId}
          workspaceId={workspaceId}
          canEdit={canEdit}
          open={!!selectedSubmittal}
          onClose={() => setSelectedSubmittalId(null)}
          onResubmit={handleResubmit}
        />
      )}
    </div>
  );
}
