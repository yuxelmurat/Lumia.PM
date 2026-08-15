CREATE TABLE "billing_charge" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"kind" text NOT NULL,
	"plan" text,
	"billing_interval" text,
	"seats" integer,
	"amount_kurus" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_billing" DROP CONSTRAINT "workspace_billing_creem_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "workspace_billing" ADD COLUMN "paytr_card_token" text;--> statement-breakpoint
ALTER TABLE "workspace_billing" ADD COLUMN "paytr_card_token_id" text;--> statement-breakpoint
ALTER TABLE "workspace_billing" ADD COLUMN "renewal_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_billing" ADD COLUMN "renewal_first_failed_at" timestamp;--> statement-breakpoint
ALTER TABLE "billing_charge" ADD CONSTRAINT "billing_charge_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_billing" DROP COLUMN "creem_customer_id";--> statement-breakpoint
ALTER TABLE "workspace_billing" DROP COLUMN "creem_subscription_id";--> statement-breakpoint
ALTER TABLE "workspace_billing" DROP COLUMN "creem_product_id";