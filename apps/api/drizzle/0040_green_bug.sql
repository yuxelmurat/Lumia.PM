CREATE TABLE "asset_guest" (
	"id" text PRIMARY KEY NOT NULL,
	"share_link_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_pin_note" (
	"id" text PRIMARY KEY NOT NULL,
	"pin_id" text NOT NULL,
	"content" text NOT NULL,
	"author_user_id" text,
	"author_guest_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_pin" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"x" real,
	"y" real,
	"viewer_state" jsonb,
	"status" text DEFAULT 'open' NOT NULL,
	"label" text,
	"created_by_user_id" text,
	"created_by_guest_id" text,
	"resolved_by_user_id" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_share_link" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"token" text NOT NULL,
	"created_by_user_id" text,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_share_link_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "asset_guest" ADD CONSTRAINT "asset_guest_share_link_id_asset_share_link_id_fk" FOREIGN KEY ("share_link_id") REFERENCES "public"."asset_share_link"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin_note" ADD CONSTRAINT "asset_pin_note_pin_id_asset_pin_id_fk" FOREIGN KEY ("pin_id") REFERENCES "public"."asset_pin"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin_note" ADD CONSTRAINT "asset_pin_note_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin_note" ADD CONSTRAINT "asset_pin_note_author_guest_id_asset_guest_id_fk" FOREIGN KEY ("author_guest_id") REFERENCES "public"."asset_guest"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_created_by_guest_id_asset_guest_id_fk" FOREIGN KEY ("created_by_guest_id") REFERENCES "public"."asset_guest"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_share_link" ADD CONSTRAINT "asset_share_link_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_share_link" ADD CONSTRAINT "asset_share_link_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "asset_guest_shareLinkId_idx" ON "asset_guest" USING btree ("share_link_id");--> statement-breakpoint
CREATE INDEX "asset_pin_note_pinId_idx" ON "asset_pin_note" USING btree ("pin_id");--> statement-breakpoint
CREATE INDEX "asset_pin_assetId_idx" ON "asset_pin" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_pin_createdByUserId_idx" ON "asset_pin" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "asset_pin_createdByGuestId_idx" ON "asset_pin" USING btree ("created_by_guest_id");--> statement-breakpoint
CREATE INDEX "asset_share_link_assetId_idx" ON "asset_share_link" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_share_link_token_uidx" ON "asset_share_link" USING btree ("token");