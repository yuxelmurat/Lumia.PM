ALTER TABLE "asset" ADD COLUMN "version_group_id" text;--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "version_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_version_group_id_asset_id_fk" FOREIGN KEY ("version_group_id") REFERENCES "public"."asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "asset_versionGroupId_idx" ON "asset" USING btree ("version_group_id");