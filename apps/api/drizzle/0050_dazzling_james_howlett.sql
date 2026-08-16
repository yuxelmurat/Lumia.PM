CREATE TABLE "image_pin" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"task_id" text NOT NULL,
	"x_percent" double precision NOT NULL,
	"y_percent" double precision NOT NULL,
	"content" text NOT NULL,
	"client_name" text,
	"user_id" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_pin" ADD CONSTRAINT "image_pin_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "image_pin" ADD CONSTRAINT "image_pin_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "image_pin" ADD CONSTRAINT "image_pin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "image_pin_assetId_idx" ON "image_pin" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "image_pin_taskId_idx" ON "image_pin" USING btree ("task_id");