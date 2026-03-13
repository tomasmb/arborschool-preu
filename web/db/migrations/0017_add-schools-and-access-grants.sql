CREATE TYPE "public"."access_grant_type" AS ENUM('email', 'domain');--> statement-breakpoint
CREATE TABLE "access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "access_grant_type" NOT NULL,
	"value" varchar(255) NOT NULL,
	"school_id" uuid,
	"granted_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"contact_email" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "schools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_status" SET DEFAULT 'free';--> statement-breakpoint
UPDATE "users" SET "subscription_status" = 'free' WHERE "subscription_status" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "school_id" uuid;--> statement-breakpoint
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_access_grants_type_value" ON "access_grants" USING btree ("type","value");--> statement-breakpoint
CREATE INDEX "idx_access_grants_school" ON "access_grants" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idx_access_grants_type" ON "access_grants" USING btree ("type");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;