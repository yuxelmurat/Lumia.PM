import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { productSpecTable } from "../../database/schema";

type UpdateProductSpecInput = Partial<{
  roomLabel: string | null;
  name: string;
  vendor: string | null;
  unitCost: number | null;
  quantity: number;
  status: "proposed" | "client_approved" | "ordered" | "received" | "installed";
  imageAssetId: string | null;
  linkedPinId: string | null;
  notes: string | null;
}>;

async function updateProductSpec(id: string, input: UpdateProductSpecInput) {
  const [updated] = await db
    .update(productSpecTable)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(productSpecTable.id, id))
    .returning();

  if (!updated) {
    throw new HTTPException(404, { message: "Product spec not found" });
  }

  return updated;
}

export default updateProductSpec;
