CREATE TABLE "asset_approval_event" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"status" text NOT NULL,
	"actor_user_id" text,
	"actor_guest_id" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "approval_status" text;--> statement-breakpoint
ALTER TABLE "asset_approval_event" ADD CONSTRAINT "asset_approval_event_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_approval_event" ADD CONSTRAINT "asset_approval_event_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_approval_event" ADD CONSTRAINT "asset_approval_event_actor_guest_id_asset_guest_id_fk" FOREIGN KEY ("actor_guest_id") REFERENCES "public"."asset_guest"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "asset_approval_event_assetId_idx" ON "asset_approval_event" USING btree ("asset_id");