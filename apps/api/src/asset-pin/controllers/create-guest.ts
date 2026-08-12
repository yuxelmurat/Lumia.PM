import db from "../../database";
import { assetGuestTable } from "../../database/schema";

async function createGuest(shareLinkId: string, name: string, email: string) {
  const [guest] = await db
    .insert(assetGuestTable)
    .values({ shareLinkId, name, email })
    .returning();

  return guest;
}

export default createGuest;
