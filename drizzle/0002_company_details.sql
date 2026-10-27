ALTER TABLE "companies" ADD COLUMN "kind" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "website" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "cover_id" text;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;