ALTER TABLE "media" ADD COLUMN "full_url" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "full_storage_key" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "full_bytes" integer DEFAULT 0 NOT NULL;