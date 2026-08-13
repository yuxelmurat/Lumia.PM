import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import db from "../../database";
import { changeOrderTable, userTable } from "../../database/schema";

const createdByUserTable = alias(userTable, "changeOrderCreatedByUser");
const decidedByUserTable = alias(userTable, "changeOrderDecidedByUser");

const changeOrderColumns = {
  id: changeOrderTable.id,
  projectId: changeOrderTable.projectId,
  number: changeOrderTable.number,
  title: changeOrderTable.title,
  description: changeOrderTable.description,
  costImpactCents: changeOrderTable.costImpactCents,
  hoursImpact: changeOrderTable.hoursImpact,
  status: changeOrderTable.status,
  createdByUserId: changeOrderTable.createdByUserId,
  createdByUserName: createdByUserTable.name,
  decidedByUserId: changeOrderTable.decidedByUserId,
  decidedByUserName: decidedByUserTable.name,
  decisionNote: changeOrderTable.decisionNote,
  decidedAt: changeOrderTable.decidedAt,
  createdAt: changeOrderTable.createdAt,
  updatedAt: changeOrderTable.updatedAt,
};

function baseQuery() {
  return db
    .select(changeOrderColumns)
    .from(changeOrderTable)
    .leftJoin(
      createdByUserTable,
      eq(changeOrderTable.createdByUserId, createdByUserTable.id),
    )
    .leftJoin(
      decidedByUserTable,
      eq(changeOrderTable.decidedByUserId, decidedByUserTable.id),
    );
}

function shape(row: Awaited<ReturnType<typeof baseQuery>>[number]) {
  return {
    id: row.id,
    projectId: row.projectId,
    number: row.number,
    title: row.title,
    description: row.description,
    costImpactCents: row.costImpactCents,
    hoursImpact: row.hoursImpact,
    status: row.status as "pending_review" | "approved" | "rejected",
    createdByUserId: row.createdByUserId,
    createdByUserName: row.createdByUserName,
    decidedByUserId: row.decidedByUserId,
    decidedByUserName: row.decidedByUserName,
    decisionNote: row.decisionNote,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function fetchChangeOrdersByProject(projectId: string) {
  const rows = await baseQuery()
    .where(eq(changeOrderTable.projectId, projectId))
    .orderBy(asc(changeOrderTable.number));

  return rows.map(shape);
}

export async function fetchChangeOrderById(id: string) {
  const [row] = await baseQuery().where(eq(changeOrderTable.id, id)).limit(1);
  return row ? shape(row) : null;
}
