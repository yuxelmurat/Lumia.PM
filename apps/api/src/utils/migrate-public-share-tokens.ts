import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import db from "../database";

/**
 * Backfills `public_share_token` for already-public projects created before
 * the public link moved from being addressed by `id` to a dedicated,
 * revocable token. Setting the token equal to `id` keeps every existing
 * public link working unchanged; owners who want a fresh, unguessable link
 * can regenerate it going forward.
 *
 * Must run after Drizzle `migrate()` so the `public_share_token` column exists.
 */
export async function migratePublicShareTokens() {
  console.log("🔄 Checking project table for public_share_token backfill...");

  try {
    const hasColumn = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'project'
      AND column_name = 'public_share_token'
    `);

    if (hasColumn.rows.length === 0) {
      console.log(
        "🛈 public_share_token column does not exist yet; skipping backfill.",
      );
      return;
    }

    const result = await db.execute(sql`
      UPDATE "project"
      SET "public_share_token" = "id"
      WHERE "is_public" = true AND "public_share_token" IS NULL
    `);

    if ((result.rowCount ?? 0) > 0) {
      console.log(
        `✅ Backfilled public_share_token for ${result.rowCount} existing public project(s).`,
      );
    }
  } catch (error) {
    console.error("❌ Error during public_share_token backfill:", error);
    throw error;
  }
}

/** Generates a fresh, unguessable public share token (used on first publish and on regenerate). */
export function generatePublicShareToken(): string {
  return createId();
}
