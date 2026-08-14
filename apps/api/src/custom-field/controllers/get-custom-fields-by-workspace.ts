import { asc, eq } from "drizzle-orm";
import db from "../../database";
import { customFieldDefinitionTable } from "../../database/schema";

function getCustomFieldsByWorkspace(workspaceId: string) {
  return db
    .select()
    .from(customFieldDefinitionTable)
    .where(eq(customFieldDefinitionTable.workspaceId, workspaceId))
    .orderBy(asc(customFieldDefinitionTable.position));
}

export default getCustomFieldsByWorkspace;
