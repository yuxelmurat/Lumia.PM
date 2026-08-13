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
ALTER TABLE "project" ADD COLUMN "last_change_order_number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "change_order" ADD CONSTRAINT "change_order_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "change_order" ADD CONSTRAINT "change_order_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "change_order" ADD CONSTRAINT "change_order_decided_by_user_id_user_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "change_order_projectId_idx" ON "change_order" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "change_order_status_idx" ON "change_order" USING btree ("status");