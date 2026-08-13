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
ALTER TABLE "project" ADD COLUMN "last_submittal_number" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_supersedes_submittal_id_submittal_id_fk" FOREIGN KEY ("supersedes_submittal_id") REFERENCES "public"."submittal"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submittal" ADD CONSTRAINT "submittal_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "submittal_projectId_idx" ON "submittal" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "submittal_status_idx" ON "submittal" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submittal_supersedesSubmittalId_idx" ON "submittal" USING btree ("supersedes_submittal_id");