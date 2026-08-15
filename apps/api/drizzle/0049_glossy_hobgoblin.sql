CREATE TABLE "task_approval" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"client_name" text NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"responded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "task_approval_task_client_unique" UNIQUE("task_id","client_name")
);
--> statement-breakpoint
ALTER TABLE "task_approval" ADD CONSTRAINT "task_approval_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "task_approval_taskId_idx" ON "task_approval" USING btree ("task_id");