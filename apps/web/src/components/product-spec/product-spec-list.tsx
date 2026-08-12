import { ImageOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ProductSpecForm, {
  type ProductSpecFormValue,
} from "@/components/product-spec/product-spec-form";
import ProductSpecStatusSelect, {
  type ProductSpecStatus,
} from "@/components/product-spec/product-spec-status-select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useDeleteProductSpec from "@/hooks/mutations/product-spec/use-delete-product-spec";
import useUpdateProductSpec from "@/hooks/mutations/product-spec/use-update-product-spec";
import useGetProductSpecs from "@/hooks/queries/product-spec/use-get-product-specs";
import { getProductSpecImageUrl } from "@/lib/product-spec-image-url";
import { toast } from "@/lib/toast";

function formatCost(unitCost: number | null) {
  if (unitCost == null) return "—";
  return (unitCost / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

type ProductSpecListProps = {
  projectId: string;
};

export default function ProductSpecList({ projectId }: ProductSpecListProps) {
  const { t } = useTranslation();
  const { data: specs = [], isLoading } = useGetProductSpecs(projectId);
  const { mutateAsync: updateProductSpec } = useUpdateProductSpec(projectId);
  const { mutateAsync: deleteProductSpec } = useDeleteProductSpec(projectId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<ProductSpecFormValue | null>(
    null,
  );

  const handleStatusChange = async (id: string, status: ProductSpecStatus) => {
    try {
      await updateProductSpec({ id, status });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("productSpec:list.updateFailed", "Failed to update status"),
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProductSpec(id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("productSpec:list.deleteFailed", "Failed to delete item"),
      );
    }
  };

  const handleEdit = (spec: (typeof specs)[number]) => {
    setEditingSpec({
      id: spec.id,
      roomLabel: spec.roomLabel,
      name: spec.name,
      vendor: spec.vendor,
      unitCost: spec.unitCost,
      quantity: spec.quantity,
      imageAssetId: spec.imageAssetId,
      notes: spec.notes,
    });
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingSpec(null);
    setIsFormOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-3 sm:px-4">
        <h1 className="text-sm font-semibold text-foreground">
          {t("productSpec:list.title", "Materials")}
        </h1>
        <Button size="xs" onClick={handleAdd}>
          {t("productSpec:list.add", "Add material")}
        </Button>
      </div>

      {isLoading ? null : specs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <h2 className="text-sm font-semibold text-foreground">
              {t("productSpec:list.empty", "No materials yet")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "productSpec:list.emptySubtitle",
                "Add furniture, fixtures and equipment specs for this project.",
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>{t("productSpec:list.room", "Room")}</TableHead>
                <TableHead>{t("productSpec:list.name", "Name")}</TableHead>
                <TableHead>{t("productSpec:list.vendor", "Vendor")}</TableHead>
                <TableHead>
                  {t("productSpec:list.unitCost", "Unit cost")}
                </TableHead>
                <TableHead>{t("productSpec:list.quantity", "Qty")}</TableHead>
                <TableHead>{t("productSpec:list.status", "Status")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {specs.map((spec) => {
                const imageUrl = getProductSpecImageUrl(spec.imageAssetId);
                return (
                  <TableRow key={spec.id}>
                    <TableCell>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={spec.name}
                          className="size-9 rounded-md border border-border/60 object-cover"
                        />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground">
                          <ImageOff className="size-3.5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {spec.roomLabel || "—"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() => handleEdit(spec)}
                      >
                        {spec.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {spec.vendor || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCost(spec.unitCost)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {spec.quantity}
                    </TableCell>
                    <TableCell>
                      <ProductSpecStatusSelect
                        value={spec.status as ProductSpecStatus}
                        onChange={(status) =>
                          handleStatusChange(spec.id, status)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleDelete(spec.id)}
                      >
                        {t("productSpec:list.delete", "Delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductSpecForm
        projectId={projectId}
        open={isFormOpen}
        editingSpec={editingSpec}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
