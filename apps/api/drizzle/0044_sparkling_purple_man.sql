ALTER TABLE "project" ADD COLUMN "public_share_token" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "public_link_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_public_share_token_unique" UNIQUE("public_share_token");