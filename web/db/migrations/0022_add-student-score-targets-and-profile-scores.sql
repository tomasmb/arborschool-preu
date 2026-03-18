CREATE TABLE "student_profile_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"score_type" varchar(20) NOT NULL,
	"score" numeric(7, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_score_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_code" varchar(20) NOT NULL,
	"score" numeric(7, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "student_profile_scores" ADD CONSTRAINT "student_profile_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_score_targets" ADD CONSTRAINT "student_score_targets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_profile_scores_user_type" ON "student_profile_scores" USING btree ("user_id","score_type");--> statement-breakpoint
CREATE INDEX "idx_student_profile_scores_user" ON "student_profile_scores" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_score_targets_user_test" ON "student_score_targets" USING btree ("user_id","test_code");--> statement-breakpoint
CREATE INDEX "idx_student_score_targets_user" ON "student_score_targets" USING btree ("user_id");