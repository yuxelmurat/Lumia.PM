ALTER TABLE "workspace" ADD COLUMN "watermark_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "watermark_style" text DEFAULT 'corner';--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "watermark_image_url" text;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "watermark_corner" text DEFAULT 'bottom-right';--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "watermark_size_percent" integer DEFAULT 20;