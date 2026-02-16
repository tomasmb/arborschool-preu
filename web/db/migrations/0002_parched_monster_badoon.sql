ALTER TABLE "users" ADD COLUMN "unsubscribed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "unsubscribed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "paes_score_min" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "paes_score_max" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "performance_tier" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "top_route_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "top_route_questions_unlocked" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "top_route_points_gain" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notified_platform_launch" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notified_platform_launch_at" timestamp with time zone;
