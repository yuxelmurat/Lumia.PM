import { HTTPException } from "hono/http-exception";
import db from "../../database";

async function getProjectTemplate(id: string) {
  const template = await db.query.projectTemplateTable.findFirst({
    where: (projectTemplate, { eq }) => eq(projectTemplate.id, id),
    with: {
      columns: {
        orderBy: (column, { asc }) => [asc(column.position)],
      },
      tasks: {
        orderBy: (task, { asc }) => [asc(task.position)],
      },
    },
  });

  if (!template) {
    throw new HTTPException(404, {
      message: "Project template not found",
    });
  }

  return template;
}

export default getProjectTemplate;
