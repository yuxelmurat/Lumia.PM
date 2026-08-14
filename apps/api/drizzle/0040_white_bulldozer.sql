CREATE TABLE "custom_field_definition" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_field_definition_workspace_name_unique" UNIQUE("workspace_id","name")
);
--> statement-breakpoint
CREATE TABLE "custom_field_value" (
	"id" text PRIMARY KEY NOT NULL,
	"field_id" text NOT NULL,
	"task_id" text NOT NULL,
	"value" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_field_value_field_task_unique" UNIQUE("field_id","task_id")
);
--> statement-breakpoint
ALTER TABLE "custom_field_definition" ADD CONSTRAINT "custom_field_definition_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "custom_field_value" ADD CONSTRAINT "custom_field_value_field_id_custom_field_definition_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."custom_field_definition"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "custom_field_value" ADD CONSTRAINT "custom_field_value_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "custom_field_definition_workspace_id_idx" ON "custom_field_definition" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "custom_field_value_field_id_idx" ON "custom_field_value" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX "custom_field_value_task_id_idx" ON "custom_field_value" USING btree ("task_id");