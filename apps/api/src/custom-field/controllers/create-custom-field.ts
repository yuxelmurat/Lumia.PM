import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { customFieldDefinitionTable } from "../../database/schema";

const ALLOWED_TYPES = ["text", "number", "date", "select", "checkbox"] as const;
type CustomFieldType = (typeof ALLOWED_TYPES)[number];

function isValidType(type: string): type is CustomFieldType {
  return (ALLOWED_TYPES as readonly string[]).includes(type);
}

async function createCustomField(
  workspaceId: string,
  name: string,
  type: string,
  options?: string[],
  isRequired?: boolean,
  position?: number,
) {
  if (!isValidType(type)) {
    throw new HTTPException(400, {
      message: `Invalid custom field type. Must be one of: ${ALLOWED_TYPES.join(", ")}`,
    });
  }

  if (type === "select" && (!options || options.length === 0)) {
    throw new HTTPException(400, {
      message: "Select fields require a non-empty options array",
    });
  }

  const [field] = await db
    .insert(customFieldDefinitionTable)
    .values({
      workspaceId,
      name,
      type,
      options: type === "select" ? options : null,
      isRequired: isRequired ?? false,
      position: position ?? 0,
    })
    .returning();

  if (!field) {
    throw new Error("Failed to create custom field");
  }

  return field;
}

export default createCustomField;
