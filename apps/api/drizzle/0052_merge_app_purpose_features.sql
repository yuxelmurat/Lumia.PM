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
	"is_punch_item" boolean DEFAULT false NOT NULL,
	"assignee_user_id" text,
	"due_date" timestamp,
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
CREATE TABLE "change_order" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"cost_impact_cents" integer,
	"hours_impact" integer,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"created_by_user_id" text,
	"decided_by_user_id" text,
	"decision_note" text,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "change_order_project_number_unique" UNIQUE("project_id","number")
);
--> statement-breakpoint
CREATE TABLE "permit" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"number" integer NOT NULL,
	"jurisdiction_name" text NOT NULL,
	"permit_type" text,
	"status" text DEFAULT 'not_submitted' NOT NULL,
	"permit_number" text,
	"submitted_date" timestamp,
	"approval_date" timestamp,
	"notes" text,
	"assignee_user_id" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permit_project_number_unique" UNIQUE("project_id","number")
);
--> statement-breakpoint
CREATE TABLE "product_spec" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"room_label" text,
	"name" text NOT NULL,
	"vendor" text,
	"unit_cost" integer,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"image_asset_id" text,
	"linked_pin_id" text,
	"notes" text,
	"po_number" text,
	"expected_ship_date" timestamp,
	"actual_ship_date" timestamp,
	"tracking_number" text,
	"carrier" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfi" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"number" integer NOT NULL,
	"subject" text NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"status" text DEFAULT 'open' NOT NULL,
	"assignee_user_id" text,
	"due_date" timestamp,
	"created_by_user_id" text,
	"answered_by_user_id" text,
	"answered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rfi_project_number_unique" UNIQUE("project_id","number")
);
--> statement-breakpoint
CREATE TABLE "submittal" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"spec_section" text,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assignee_user_id" text,
	"due_date" timestamp,
	"supersedes_submittal_id" text,
	"review_note" text,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "submittal_project_number_unique" UNIQUE("project_id","number")
);
--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "aps_urn" text;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "aps_translation_status" text;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "approval_status" text;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "supersedes_asset_id" text;--> statement-breakpoint
ALTER TABLE "column" ADD COLUMN "budget_hours" integer;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "last_rfi_number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "last_change_order_number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "last_submittal_number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "last_permit_number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "estimated_hours" integer;--> statement-breakpoint
ALTER TABLE "asset_approval_event" ADD CONSTRAINT "asset_approval_event_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_approval_event" ADD CONSTRAINT "asset_approval_event_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_approval_event" ADD CONSTRAINT "asset_approval_event_actor_guest_id_asset_guest_id_fk" FOREIGN KEY ("actor_guest_id") REFERENCES "public"."asset_guest"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_guest" ADD CONSTRAINT "asset_guest_share_link_id_asset_share_link_id_fk" FOREIGN KEY ("share_link_id") REFERENCES "public"."asset_share_link"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin_note" ADD CONSTRAINT "asset_pin_note_pin_id_asset_pin_id_fk" FOREIGN KEY ("pin_id") REFERENCES "public"."asset_pin"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin_note" ADD CONSTRAINT "asset_pin_note_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin_note" ADD CONSTRAINT "asset_pin_note_author_guest_id_asset_guest_id_fk" FOREIGN KEY ("author_guest_id") REFERENCES "public"."asset_guest"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_created_by_guest_id_asset_guest_id_fk" FOREIGN KEY ("created_by_guest_id") REFERENCES "public"."asset_guest"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_pin" ADD CONSTRAINT "asset_pin_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_share_link" ADD CONSTRAINT "asset_share_link_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_share_link" ADD CONSTRAINT "asset_share_link_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "change_order" ADD CONSTRAINT "change_order_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "change_order" ADD CONSTRAINT "change_order_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "change_order" ADD CONSTRAINT "change_order_decided_by_user_id_user_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_image_asset_id_asset_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_linked_pin_id_asset_pin_id_fk" FOREIGN KEY ("linked_pin_id") REFERENCES "public"."asset_pin"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rfi" ADD CONSTRAINT "rfi_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rfi" ADD CONSTRAINT "rfi_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rfi" ADD CONSTRAINT "rfi_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rfi" ADD CONSTRAINT "rfi_answered_by_user_id_user_id_fk" FOREIGN KEY ("answered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_supersedes_submittal_id_submittal_id_fk" FOREIGN KEY ("supersedes_submittal_id") REFERENCES "public"."submittal"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "asset_approval_event_assetId_idx" ON "asset_approval_event" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_guest_shareLinkId_idx" ON "asset_guest" USING btree ("share_link_id");--> statement-breakpoint
CREATE INDEX "asset_pin_note_pinId_idx" ON "asset_pin_note" USING btree ("pin_id");--> statement-breakpoint
CREATE INDEX "asset_pin_assetId_idx" ON "asset_pin" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_pin_createdByUserId_idx" ON "asset_pin" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "asset_pin_createdByGuestId_idx" ON "asset_pin" USING btree ("created_by_guest_id");--> statement-breakpoint
CREATE INDEX "asset_pin_assetId_isPunchItem_idx" ON "asset_pin" USING btree ("asset_id","is_punch_item");--> statement-breakpoint
CREATE INDEX "asset_share_link_assetId_idx" ON "asset_share_link" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_share_link_token_uidx" ON "asset_share_link" USING btree ("token");--> statement-breakpoint
CREATE INDEX "change_order_projectId_idx" ON "change_order" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "change_order_status_idx" ON "change_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "permit_projectId_idx" ON "permit" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "permit_status_idx" ON "permit" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_spec_projectId_idx" ON "product_spec" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "product_spec_status_idx" ON "product_spec" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rfi_projectId_idx" ON "rfi" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "rfi_status_idx" ON "rfi" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submittal_projectId_idx" ON "submittal" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "submittal_status_idx" ON "submittal" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submittal_supersedesSubmittalId_idx" ON "submittal" USING btree ("supersedes_submittal_id");--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_supersedes_asset_id_asset_id_fk" FOREIGN KEY ("supersedes_asset_id") REFERENCES "public"."asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "asset_supersedesAssetId_idx" ON "asset" USING btree ("supersedes_asset_id");