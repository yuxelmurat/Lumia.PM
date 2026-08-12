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
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_image_asset_id_asset_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_linked_pin_id_asset_pin_id_fk" FOREIGN KEY ("linked_pin_id") REFERENCES "public"."asset_pin"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "product_spec_projectId_idx" ON "product_spec" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "product_spec_status_idx" ON "product_spec" USING btree ("status");