import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useGetChangeOrders from "@/hooks/queries/change-order/use-get-change-orders";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { formatCurrencyFromCents } from "@/lib/format-currency";
import ChangeOrderDetailPanel from "./change-order-detail-panel";
import ChangeOrderForm from "./change-order-form";
import ChangeOrderStatusBadge, {
  type ChangeOrderStatus,
} from "./change-order-status-badge";

type ChangeOrderListProps = {
  projectId: string;
};

export default function ChangeOrderList({ projectId }: ChangeOrderListProps) {
  const { t } = useTranslation();
  const { data: changeOrders = [], isLoading } = useGetChangeOrders(projectId);
  const { canManageChangeOrders } = useWorkspacePermission();
  const canEdit = canManageChangeOrders();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = changeOrders.find((co) => co.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-3 sm:px-4">
        <h1 className="text-sm font-semibold text-foreground">
          {t("changeOrder:list.title", "Change Orders")}
        </h1>
        {canEdit && (
          <Button size="xs" onClick={() => setIsFormOpen(true)}>
            {t("changeOrder:list.add", "New change order")}
          </Button>
        )}
      </div>

      {isLoading ? null : changeOrders.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <h2 className="text-sm font-semibold text-foreground">
              {t("changeOrder:list.empty", "No change orders yet")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "changeOrder:list.emptySubtitle",
                "Track client-requested scope changes with their cost and time impact.",
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("changeOrder:list.number", "#")}</TableHead>
                <TableHead>{t("changeOrder:list.title2", "Title")}</TableHead>
                <TableHead>
                  {t("changeOrder:list.costImpact", "Cost impact")}
                </TableHead>
                <TableHead>
                  {t("changeOrder:list.hoursImpact", "Hours impact")}
                </TableHead>
                <TableHead>{t("changeOrder:list.status", "Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changeOrders.map((co) => (
                <TableRow key={co.id}>
                  <TableCell className="text-muted-foreground">
                    CO-{co.number}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <button
                      type="button"
                      className="text-left hover:underline"
                      onClick={() => setSelectedId(co.id)}
                    >
                      {co.title}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrencyFromCents(co.costImpactCents)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {co.hoursImpact != null ? `${co.hoursImpact}h` : "—"}
                  </TableCell>
                  <TableCell>
                    <ChangeOrderStatusBadge
                      status={co.status as ChangeOrderStatus}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ChangeOrderForm
        projectId={projectId}
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {selected && (
        <ChangeOrderDetailPanel
          changeOrder={selected}
          projectId={projectId}
          canEdit={canEdit}
          open={!!selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
