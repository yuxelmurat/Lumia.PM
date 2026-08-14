ALTER TABLE "task" ADD COLUMN "approval_status" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "approval_note" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "approval_client_name" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "approval_responded_at" timestamp;