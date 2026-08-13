import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useCreateProductSpec from "@/hooks/mutations/product-spec/use-create-product-spec";
import useUpdateProductSpec from "@/hooks/mutations/product-spec/use-update-product-spec";
import { getProductSpecImageUrl } from "@/lib/product-spec-image-url";
import { toast } from "@/lib/toast";
import { uploadProductSpecImage } from "@/lib/upload-product-spec-image";

export type ProductSpecFormValue = {
  id: string;
  roomLabel: string | null;
  name: string;
  vendor: string | null;
  unitCost: number | null;
  quantity: number;
  imageAssetId: string | null;
  notes: string | null;
  status: string;
  poNumber: string | null;
  expectedShipDate: string | null;
  actualShipDate: string | null;
  trackingNumber: string | null;
  carrier: string | null;
};

type ProductSpecPrefill = {
  name: string;
  imageAssetId?: string;
  linkedPinId?: string;
};

type ProductSpecFormProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  editingSpec?: ProductSpecFormValue | null;
  prefill?: ProductSpecPrefill;
};

export default function ProductSpecForm({
  projectId,
  open,
  onClose,
  editingSpec,
  prefill,
}: ProductSpecFormProps) {
  const { t } = useTranslation();
  const [roomLabel, setRoomLabel] = useState("");
  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [imageAssetId, setImageAssetId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [expectedShipDate, setExpectedShipDate] = useState("");
  const [actualShipDate, setActualShipDate] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const showOrderDetails =
    !!editingSpec &&
    ["ordered", "received", "installed"].includes(editingSpec.status);
  const imageUrl = getProductSpecImageUrl(imageAssetId);

  const { mutateAsync: createProductSpec, isPending: isCreating } =
    useCreateProductSpec(projectId);
  const { mutateAsync: updateProductSpec, isPending: isUpdating } =
    useUpdateProductSpec(projectId);
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    setRoomLabel(editingSpec?.roomLabel ?? "");
    setName(editingSpec?.name ?? prefill?.name ?? "");
    setVendor(editingSpec?.vendor ?? "");
    setUnitCost(
      editingSpec?.unitCost != null
        ? (editingSpec.unitCost / 100).toString()
        : "",
    );
    setQuantity(editingSpec ? String(editingSpec.quantity) : "1");
    setNotes(editingSpec?.notes ?? "");
    setImageAssetId(editingSpec?.imageAssetId ?? prefill?.imageAssetId ?? null);
    setPoNumber(editingSpec?.poNumber ?? "");
    setExpectedShipDate(editingSpec?.expectedShipDate?.slice(0, 10) ?? "");
    setActualShipDate(editingSpec?.actualShipDate?.slice(0, 10) ?? "");
    setTrackingNumber(editingSpec?.trackingNumber ?? "");
    setCarrier(editingSpec?.carrier ?? "");
  }, [open, editingSpec, prefill]);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const asset = await uploadProductSpecImage({ projectId, file });
      setImageAssetId(asset.id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("productSpec:form.imageUploadFailed", "Failed to upload image"),
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    const parsedUnitCost = unitCost.trim()
      ? Math.round(Number.parseFloat(unitCost) * 100)
      : null;
    const parsedQuantity = Number.parseInt(quantity, 10) || 1;

    try {
      if (editingSpec) {
        await updateProductSpec({
          id: editingSpec.id,
          roomLabel: roomLabel.trim() || null,
          name: name.trim(),
          vendor: vendor.trim() || null,
          unitCost: parsedUnitCost,
          quantity: parsedQuantity,
          imageAssetId,
          notes: notes.trim() || null,
          poNumber: poNumber.trim() || null,
          expectedShipDate: expectedShipDate || null,
          actualShipDate: actualShipDate || null,
          trackingNumber: trackingNumber.trim() || null,
          carrier: carrier.trim() || null,
        });
      } else {
        await createProductSpec({
          projectId,
          roomLabel: roomLabel.trim() || undefined,
          name: name.trim(),
          vendor: vendor.trim() || undefined,
          unitCost: parsedUnitCost ?? undefined,
          quantity: parsedQuantity,
          imageAssetId: imageAssetId ?? undefined,
          linkedPinId: prefill?.linkedPinId,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("productSpec:form.saveFailed", "Failed to save item"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingSpec
              ? t("productSpec:form.editTitle", "Edit material")
              : t("productSpec:form.createTitle", "Add material")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "productSpec:form.description",
              "Track FF&E and material specs for this project.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="product-spec-room">
                {t("productSpec:form.room", "Room")}
              </Label>
              <Input
                id="product-spec-room"
                value={roomLabel}
                onChange={(event) => setRoomLabel(event.target.value)}
                placeholder={t(
                  "productSpec:form.roomPlaceholder",
                  "Living room",
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-spec-vendor">
                {t("productSpec:form.vendor", "Vendor")}
              </Label>
              <Input
                id="product-spec-vendor"
                value={vendor}
                onChange={(event) => setVendor(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-spec-name">
              {t("productSpec:form.name", "Name")}
            </Label>
            <Input
              id="product-spec-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="product-spec-unit-cost">
                {t("productSpec:form.unitCost", "Unit cost")}
              </Label>
              <Input
                id="product-spec-unit-cost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-spec-quantity">
                {t("productSpec:form.quantity", "Quantity")}
              </Label>
              <Input
                id="product-spec-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-spec-image">
              {t("productSpec:form.image", "Reference image")}
            </Label>
            {imageUrl && (
              <div className="flex items-center gap-2">
                <img
                  src={imageUrl}
                  alt=""
                  className="size-14 rounded-md border border-border/60 object-cover"
                />
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => setImageAssetId(null)}
                >
                  {t("productSpec:form.removeImage", "Remove")}
                </Button>
              </div>
            )}
            <Input
              id="product-spec-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isUploadingImage}
            />
            {isUploadingImage && (
              <p className="text-muted-foreground text-xs">
                {t("productSpec:form.uploading", "Uploading…")}
              </p>
            )}
          </div>

          {showOrderDetails && (
            <div className="space-y-3 rounded-md border border-border/60 p-3">
              <p className="text-xs font-semibold text-foreground">
                {t("productSpec:form.orderDetails", "Order details")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="product-spec-po-number">
                    {t("productSpec:form.poNumber", "PO number")}
                  </Label>
                  <Input
                    id="product-spec-po-number"
                    value={poNumber}
                    onChange={(event) => setPoNumber(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-spec-carrier">
                    {t("productSpec:form.carrier", "Carrier")}
                  </Label>
                  <Input
                    id="product-spec-carrier"
                    value={carrier}
                    onChange={(event) => setCarrier(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="product-spec-expected-ship-date">
                    {t(
                      "productSpec:form.expectedShipDate",
                      "Expected ship date",
                    )}
                  </Label>
                  <Input
                    id="product-spec-expected-ship-date"
                    type="date"
                    value={expectedShipDate}
                    onChange={(event) =>
                      setExpectedShipDate(event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-spec-actual-ship-date">
                    {t("productSpec:form.actualShipDate", "Actual ship date")}
                  </Label>
                  <Input
                    id="product-spec-actual-ship-date"
                    type="date"
                    value={actualShipDate}
                    onChange={(event) => setActualShipDate(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-spec-tracking-number">
                  {t("productSpec:form.trackingNumber", "Tracking number")}
                </Label>
                <Input
                  id="product-spec-tracking-number"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="product-spec-notes">
              {t("productSpec:form.notes", "Notes")}
            </Label>
            <Textarea
              id="product-spec-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[4rem] resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common:cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isSaving || isUploadingImage}>
              {editingSpec
                ? t("productSpec:form.save", "Save")
                : t("productSpec:form.create", "Add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
