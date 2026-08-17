ALTER TABLE "task" ADD COLUMN "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "public_share_token" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "public_link_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_public_share_token_unique" UNIQUE("public_share_token");