import db from "../../database";
import { productSpecTable } from "../../database/schema";

type CreateProductSpecInput = {
  roomLabel?: string | null;
  name: string;
  vendor?: string | null;
  unitCost?: number | null;
  quantity?: number;
  imageAssetId?: string | null;
  linkedPinId?: string | null;
  notes?: string | null;
};

async function createProductSpec(
  projectId: string,
  userId: string,
  input: CreateProductSpecInput,
) {
  const [productSpec] = await db
    .insert(productSpecTable)
    .values({
      projectId,
      roomLabel: input.roomLabel ?? null,
      name: input.name,
      vendor: input.vendor ?? null,
      unitCost: input.unitCost ?? null,
      quantity: input.quantity ?? 1,
      imageAssetId: input.imageAssetId ?? null,
      linkedPinId: input.linkedPinId ?? null,
      notes: input.notes ?? null,
      createdByUserId: userId,
    })
    .returning();

  return productSpec;
}

export default createProductSpec;
