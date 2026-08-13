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
ALTER TABLE "project" ADD COLUMN "last_permit_number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permit" ADD CONSTRAINT "permit_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "permit_projectId_idx" ON "permit" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "permit_status_idx" ON "permit" USING btree ("status");