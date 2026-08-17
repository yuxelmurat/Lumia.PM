import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import db from "../../database";
import { rfiTable, userTable } from "../../database/schema";

const assigneeUserTable = alias(userTable, "rfiAssigneeUser");
const createdByUserTable = alias(userTable, "rfiCreatedByUser");
const answeredByUserTable = alias(userTable, "rfiAnsweredByUser");

const rfiColumns = {
  id: rfiTable.id,
  projectId: rfiTable.projectId,
  number: rfiTable.number,
  subject: rfiTable.subject,
  question: rfiTable.question,
  answer: rfiTable.answer,
  status: rfiTable.status,
  dueDate: rfiTable.dueDate,
  assigneeUserId: rfiTable.assigneeUserId,
  assigneeUserName: assigneeUserTable.name,
  createdByUserId: rfiTable.createdByUserId,
  createdByUserName: createdByUserTable.name,
  answeredByUserId: rfiTable.answeredByUserId,
  answeredByUserName: answeredByUserTable.name,
  answeredAt: rfiTable.answeredAt,
  createdAt: rfiTable.createdAt,
  updatedAt: rfiTable.updatedAt,
};

function baseQuery() {
  return db
    .select(rfiColumns)
    .from(rfiTable)
    .leftJoin(
      assigneeUserTable,
      eq(rfiTable.assigneeUserId, assigneeUserTable.id),
    )
    .leftJoin(
      createdByUserTable,
      eq(rfiTable.createdByUserId, createdByUserTable.id),
    )
    .leftJoin(
      answeredByUserTable,
      eq(rfiTable.answeredByUserId, answeredByUserTable.id),
    );
}

function shape(row: Awaited<ReturnType<typeof baseQuery>>[number]) {
  return {
    id: row.id,
    projectId: row.projectId,
    number: row.number,
    subject: row.subject,
    question: row.question,
    answer: row.answer,
    status: row.status as "open" | "answered" | "closed",
    dueDate: row.dueDate,
    assignee: row.assigneeUserId
      ? { id: row.assigneeUserId, name: row.assigneeUserName }
      : null,
    createdByUserId: row.createdByUserId,
    createdByUserName: row.createdByUserName,
    answeredByUserId: row.answeredByUserId,
    answeredByUserName: row.answeredByUserName,
    answeredAt: row.answeredAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function fetchRfisByProject(projectId: string) {
  const rows = await baseQuery()
    .where(eq(rfiTable.projectId, projectId))
    .orderBy(asc(rfiTable.number));

  return rows.map(shape);
}

export async function fetchRfiById(id: string) {
  const [row] = await baseQuery().where(eq(rfiTable.id, id)).limit(1);
  return row ? shape(row) : null;
}
