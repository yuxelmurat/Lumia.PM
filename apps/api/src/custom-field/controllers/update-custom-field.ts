import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { customFieldDefinitionTable } from "../../database/schema";

type UpdateCustomFieldInput = {
  name?: string;
  options?: string[] | null;
  isRequired?: boolean;
  position?: number;
  type?: string;
};

async function updateCustomField(id: string, input: UpdateCustomFieldInput) {
  const field = await db.query.customFieldDefinitionTable.findFirst({
    where: (customField, { eq }) => eq(customField.id, id),
  });

  if (!field) {
    throw new HTTPException(404, {
      message: "Custom field not found",
    });
  }

  if (input.type !== undefined && input.type !== field.type) {
    throw new HTTPException(400, {
      message: "Changing a custom field's type after creation is not allowed",
    });
  }

  if (field.type === "select" && input.options !== undefined) {
    if (!input.options || input.options.length === 0) {
      throw new HTTPException(400, {
        message: "Select fields require a non-empty options array",
      });
    }
  }

  const [updated] = await db
    .update(customFieldDefinitionTable)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.options !== undefined ? { options: input.options } : {}),
      ...(input.isRequired !== undefined
        ? { isRequired: input.isRequired }
        : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    })
    .where(eq(customFieldDefinitionTable.id, id))
    .returning();

  if (!updated) {
    throw new HTTPException(404, {
      message: "Custom field not found",
    });
  }

  return updated;
}

export default updateCustomField;
