import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import db from "../../database";
import { submittalTable, userTable } from "../../database/schema";

const assigneeUserTable = alias(userTable, "submittalAssigneeUser");
const createdByUserTable = alias(userTable, "submittalCreatedByUser");
const reviewedByUserTable = alias(userTable, "submittalReviewedByUser");
const supersedesSubmittalTable = alias(submittalTable, "supersedesSubmittal");

const submittalColumns = {
  id: submittalTable.id,
  projectId: submittalTable.projectId,
  number: submittalTable.number,
  title: submittalTable.title,
  specSection: submittalTable.specSection,
  description: submittalTable.description,
  status: submittalTable.status,
  dueDate: submittalTable.dueDate,
  assigneeUserId: submittalTable.assigneeUserId,
  assigneeUserName: assigneeUserTable.name,
  supersedesSubmittalId: submittalTable.supersedesSubmittalId,
  supersedesSubmittalNumber: supersedesSubmittalTable.number,
  reviewNote: submittalTable.reviewNote,
  reviewedByUserId: submittalTable.reviewedByUserId,
  reviewedByUserName: reviewedByUserTable.name,
  reviewedAt: submittalTable.reviewedAt,
  createdByUserId: submittalTable.createdByUserId,
  createdByUserName: createdByUserTable.name,
  createdAt: submittalTable.createdAt,
  updatedAt: submittalTable.updatedAt,
};

function baseQuery() {
  return db
    .select(submittalColumns)
    .from(submittalTable)
    .leftJoin(
      assigneeUserTable,
      eq(submittalTable.assigneeUserId, assigneeUserTable.id),
    )
    .leftJoin(
      createdByUserTable,
      eq(submittalTable.createdByUserId, createdByUserTable.id),
    )
    .leftJoin(
      reviewedByUserTable,
      eq(submittalTable.reviewedByUserId, reviewedByUserTable.id),
    )
    .leftJoin(
      supersedesSubmittalTable,
      eq(submittalTable.supersedesSubmittalId, supersedesSubmittalTable.id),
    );
}

function shape(row: Awaited<ReturnType<typeof baseQuery>>[number]) {
  return {
    id: row.id,
    projectId: row.projectId,
    number: row.number,
    title: row.title,
    specSection: row.specSection,
    description: row.description,
    status: row.status as "open" | "approved" | "revise_resubmit" | "closed",
    dueDate: row.dueDate,
    assignee: row.assigneeUserId
      ? { id: row.assigneeUserId, name: row.assigneeUserName }
      : null,
    supersedesSubmittalId: row.supersedesSubmittalId,
    supersedesSubmittalNumber: row.supersedesSubmittalNumber,
    reviewNote: row.reviewNote,
    reviewedByUserId: row.reviewedByUserId,
    reviewedByUserName: row.reviewedByUserName,
    reviewedAt: row.reviewedAt,
    createdByUserId: row.createdByUserId,
    createdByUserName: row.createdByUserName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function fetchSubmittalsByProject(projectId: string) {
  const rows = await baseQuery()
    .where(eq(submittalTable.projectId, projectId))
    .orderBy(asc(submittalTable.number));

  return rows.map(shape);
}

export async function fetchSubmittalById(id: string) {
  const [row] = await baseQuery().where(eq(submittalTable.id, id)).limit(1);
  return row ? shape(row) : null;
}
