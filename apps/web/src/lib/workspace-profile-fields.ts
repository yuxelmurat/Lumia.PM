/**
 * Better Auth persists workspace (organization) additional fields as real DB
 * columns, but the web app's auth client doesn't have `inferAdditionalFields`
 * registered for `organization` (only for `user` — see auth-client.ts), so
 * these fields are typed loosely and read defensively here instead. Values
 * may also show up nested under `metadata` depending on how Better Auth last
 * serialized them, so each helper checks both locations.
 */
export type WorkspaceWithProfileFields = {
  description?: string | null;
  logo?: string | null;
  legalName?: string | null;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  accentColor?: string | null;
  watermarkEnabled?: boolean | null;
  watermarkStyle?: string | null;
  watermarkImageUrl?: string | null;
  watermarkCorner?: string | null;
  watermarkSizePercent?: number | null;
  metadata?: unknown;
};

export function getWorkspaceProfileField(
  workspace: WorkspaceWithProfileFields | null | undefined,
  field: keyof Omit<WorkspaceWithProfileFields, "metadata">,
): string {
  if (!workspace) return "";
  const direct = workspace[field];
  if (typeof direct === "string") {
    return direct;
  }
  if (
    typeof workspace.metadata === "object" &&
    workspace.metadata &&
    field in workspace.metadata
  ) {
    return String((workspace.metadata as Record<string, unknown>)[field] ?? "");
  }
  return "";
}

/** Boolean sibling of {@link getWorkspaceProfileField}, for fields like `watermarkEnabled`. */
export function getWorkspaceBooleanProfileField(
  workspace: WorkspaceWithProfileFields | null | undefined,
  field: keyof Omit<WorkspaceWithProfileFields, "metadata">,
): boolean {
  if (!workspace) return false;
  const direct = workspace[field];
  if (typeof direct === "boolean") {
    return direct;
  }
  if (
    typeof workspace.metadata === "object" &&
    workspace.metadata &&
    field in workspace.metadata
  ) {
    return Boolean((workspace.metadata as Record<string, unknown>)[field]);
  }
  return false;
}

/** Numeric sibling of {@link getWorkspaceProfileField}, for fields like `watermarkSizePercent`. */
export function getWorkspaceNumberProfileField(
  workspace: WorkspaceWithProfileFields | null | undefined,
  field: keyof Omit<WorkspaceWithProfileFields, "metadata">,
): number | undefined {
  if (!workspace) return undefined;
  const direct = workspace[field];
  if (typeof direct === "number") {
    return direct;
  }
  if (
    typeof workspace.metadata === "object" &&
    workspace.metadata &&
    field in workspace.metadata
  ) {
    const raw = (workspace.metadata as Record<string, unknown>)[field];
    return typeof raw === "number" ? raw : undefined;
  }
  return undefined;
}
