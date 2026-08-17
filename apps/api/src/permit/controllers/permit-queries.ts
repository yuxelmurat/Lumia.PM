import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import db from "../../database";
import { permitTable, userTable } from "../../database/schema";

const assigneeUserTable = alias(userTable, "permitAssigneeUser");
const createdByUserTable = alias(userTable, "permitCreatedByUser");

const permitColumns = {
  id: permitTable.id,
  projectId: permitTable.projectId,
  number: permitTable.number,
  jurisdictionName: permitTable.jurisdictionName,
  permitType: permitTable.permitType,
  status: permitTable.status,
  permitNumber: permitTable.permitNumber,
  submittedDate: permitTable.submittedDate,
  approvalDate: permitTable.approvalDate,
  notes: permitTable.notes,
  assigneeUserId: permitTable.assigneeUserId,
  assigneeUserName: assigneeUserTable.name,
  createdByUserId: permitTable.createdByUserId,
  createdByUserName: createdByUserTable.name,
  createdAt: permitTable.createdAt,
  updatedAt: permitTable.updatedAt,
};

function baseQuery() {
  return db
    .select(permitColumns)
    .from(permitTable)
    .leftJoin(
      assigneeUserTable,
      eq(permitTable.assigneeUserId, assigneeUserTable.id),
    )
    .leftJoin(
      createdByUserTable,
      eq(permitTable.createdByUserId, createdByUserTable.id),
    );
}

function shape(row: Awaited<ReturnType<typeof baseQuery>>[number]) {
  return {
    id: row.id,
    projectId: row.projectId,
    number: row.number,
    jurisdictionName: row.jurisdictionName,
    permitType: row.permitType,
    status: row.status as
      | "not_submitted"
      | "submitted"
      | "corrections_required"
      | "approved"
      | "issued",
    permitNumber: row.permitNumber,
    submittedDate: row.submittedDate,
    approvalDate: row.approvalDate,
    notes: row.notes,
    assignee: row.assigneeUserId
      ? { id: row.assigneeUserId, name: row.assigneeUserName }
      : null,
    createdByUserId: row.createdByUserId,
    createdByUserName: row.createdByUserName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function fetchPermitsByProject(projectId: string) {
  const rows = await baseQuery()
    .where(eq(permitTable.projectId, projectId))
    .orderBy(asc(permitTable.number));

  return rows.map(shape);
}

export async function fetchPermitById(id: string) {
  const [row] = await baseQuery().where(eq(permitTable.id, id)).limit(1);
  return row ? shape(row) : null;
}
