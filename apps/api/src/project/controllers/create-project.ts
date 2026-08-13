import { eq, max, sql } from "drizzle-orm";
import db from "../../database";
import { columnTable, projectTable } from "../../database/schema";

export const DEFAULT_PROJECT_COLUMNS = [
  { name: "To Do", slug: "to-do", position: 0, isFinal: false },
  { name: "In Progress", slug: "in-progress", position: 1, isFinal: false },
  { name: "In Review", slug: "in-review", position: 2, isFinal: false },
  { name: "Done", slug: "done", position: 3, isFinal: true },
] as const;

// Phase templates for professions whose workflow doesn't map to a generic
// to-do/in-progress/done board — see the Faz B roadmap (architecture &
// interior design office pain point: "generic tools don't model the
// profession's phases").
export const PROJECT_COLUMN_TEMPLATES = {
  generic: DEFAULT_PROJECT_COLUMNS,
  architecture: [
    { name: "Concept", slug: "concept", position: 0, isFinal: false },
    {
      name: "Schematic Design",
      slug: "schematic-design",
      position: 1,
      isFinal: false,
    },
    {
      name: "Design Development",
      slug: "design-development",
      position: 2,
      isFinal: false,
    },
    {
      name: "Construction Documents",
      slug: "construction-documents",
      position: 3,
      isFinal: false,
    },
    {
      name: "Construction Administration",
      slug: "construction-administration",
      position: 4,
      isFinal: true,
    },
  ],
  interior_design: [
    { name: "Discovery", slug: "discovery", position: 0, isFinal: false },
    { name: "Concept", slug: "concept", position: 1, isFinal: false },
    {
      name: "Design Development",
      slug: "design-development",
      position: 2,
      isFinal: false,
    },
    {
      name: "Construction Drawings",
      slug: "construction-drawings",
      position: 3,
      isFinal: false,
    },
    { name: "Procurement", slug: "procurement", position: 4, isFinal: false },
    { name: "Installation", slug: "installation", position: 5, isFinal: true },
  ],
} as const;

export type ProjectType = keyof typeof PROJECT_COLUMN_TEMPLATES;

async function createProject(
  workspaceId: string,
  name: string,
  icon: string,
  slug: string,
  projectType: ProjectType = "generic",
) {
  return db.transaction(async (tx) => {
    // Serialize ordering writes per workspace: without this, two concurrent
    // creates can read the same max(position) and land on the same slot, and a
    // create can interleave with a reorder's renumber. `reorderProjects` takes
    // the same lock with the same key.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(1524, hashtext(${workspaceId}))`,
    );

    // New projects go to the bottom of the workspace's ordering.
    const [{ maxPosition } = { maxPosition: null }] = await tx
      .select({ maxPosition: max(projectTable.position) })
      .from(projectTable)
      .where(eq(projectTable.workspaceId, workspaceId));

    const [createdProject] = await tx
      .insert(projectTable)
      .values({
        workspaceId,
        name,
        icon,
        slug,
        position: maxPosition === null ? 0 : maxPosition + 1,
      })
      .returning();

    if (createdProject) {
      for (const col of PROJECT_COLUMN_TEMPLATES[projectType]) {
        await tx.insert(columnTable).values({
          projectId: createdProject.id,
          name: col.name,
          slug: col.slug,
          position: col.position,
          isFinal: col.isFinal,
        });
      }
    }

    return createdProject;
  });
}

export default createProject;
