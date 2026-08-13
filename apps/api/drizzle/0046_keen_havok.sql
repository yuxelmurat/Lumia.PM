ALTER TABLE "asset" ADD COLUMN "supersedes_asset_id" text;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_supersedes_asset_id_asset_id_fk" FOREIGN KEY ("supersedes_asset_id") REFERENCES "public"."asset"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "asset_supersedesAssetId_idx" ON "asset" USING btree ("supersedes_asset_id");