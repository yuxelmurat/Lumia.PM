ALTER TABLE "asset_pin" ADD COLUMN "is_punch_item" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD COLUMN "assignee_user_id" text;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "asset_pin_assetId_isPunchItem_idx" ON "asset_pin" USING btree ("asset_id","is_punch_item");