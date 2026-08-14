import { eq } from "drizzle-orm";
import db from "../../database";
import {
  customFieldDefinitionTable,
  customFieldValueTable,
} from "../../database/schema";

async function getTaskCustomFieldValues(taskId: string) {
  const rows = await db
    .select({
      id: customFieldValueTable.id,
      fieldId: customFieldValueTable.fieldId,
      taskId: customFieldValueTable.taskId,
      value: customFieldValueTable.value,
      createdAt: customFieldValueTable.createdAt,
      updatedAt: customFieldValueTable.updatedAt,
      field: {
        id: customFieldDefinitionTable.id,
        workspaceId: customFieldDefinitionTable.workspaceId,
        name: customFieldDefinitionTable.name,
        type: customFieldDefinitionTable.type,
        options: customFieldDefinitionTable.options,
        isRequired: customFieldDefinitionTable.isRequired,
        position: customFieldDefinitionTable.position,
        createdAt: customFieldDefinitionTable.createdAt,
        updatedAt: customFieldDefinitionTable.updatedAt,
      },
    })
    .from(customFieldValueTable)
    .innerJoin(
      customFieldDefinitionTable,
      eq(customFieldValueTable.fieldId, customFieldDefinitionTable.id),
    )
    .where(eq(customFieldValueTable.taskId, taskId));

  return rows;
}

export default getTaskCustomFieldValues;
