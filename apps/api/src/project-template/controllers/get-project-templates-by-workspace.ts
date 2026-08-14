import { asc, count, eq } from "drizzle-orm";
import db from "../../database";
import {
  projectTemplateColumnTable,
  projectTemplateTable,
} from "../../database/schema";

async function getProjectTemplatesByWorkspace(workspaceId: string) {
  const rows = await db
    .select({
      id: projectTemplateTable.id,
      workspaceId: projectTemplateTable.workspaceId,
      name: projectTemplateTable.name,
      description: projectTemplateTable.description,
      icon: projectTemplateTable.icon,
      createdAt: projectTemplateTable.createdAt,
      updatedAt: projectTemplateTable.updatedAt,
      columnCount: count(projectTemplateColumnTable.id),
    })
    .from(projectTemplateTable)
    .leftJoin(
      projectTemplateColumnTable,
      eq(projectTemplateColumnTable.templateId, projectTemplateTable.id),
    )
    .where(eq(projectTemplateTable.workspaceId, workspaceId))
    .groupBy(projectTemplateTable.id)
    .orderBy(asc(projectTemplateTable.name));

  return rows.map((row) => ({
    ...row,
    columnCount: Number(row.columnCount),
  }));
}

export default getProjectTemplatesByWorkspace;
