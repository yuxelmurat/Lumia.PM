ALTER TABLE "product_spec" ADD COLUMN "po_number" text;--> statement-breakpoint
ALTER TABLE "product_spec" ADD COLUMN "expected_ship_date" timestamp;--> statement-breakpoint
ALTER TABLE "product_spec" ADD COLUMN "actual_ship_date" timestamp;--> statement-breakpoint
ALTER TABLE "product_spec" ADD COLUMN "tracking_number" text;--> statement-breakpoint
ALTER TABLE "product_spec" ADD COLUMN "carrier" text;