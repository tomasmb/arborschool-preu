CREATE TABLE "admissions_datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" varchar(40) NOT NULL,
	"source" varchar(120) NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "admissions_datasets_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "career_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"university_id" uuid NOT NULL,
	"career_id" uuid NOT NULL,
	"external_code" varchar(60),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "careers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(60) NOT NULL,
	"name" varchar(180) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "careers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "offering_cutoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"admission_year" integer NOT NULL,
	"cutoff_score" numeric(7, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offering_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"test_code" varchar(20) NOT NULL,
	"weight_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_goal_buffers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"buffer_points" integer DEFAULT 30 NOT NULL,
	"source" varchar(20) DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_goal_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"test_code" varchar(20) NOT NULL,
	"score" numeric(7, 2) NOT NULL,
	"source" varchar(20) DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"priority" integer NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(180) NOT NULL,
	"short_name" varchar(80),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "universities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "career_offerings" ADD CONSTRAINT "career_offerings_dataset_id_admissions_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."admissions_datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_offerings" ADD CONSTRAINT "career_offerings_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_offerings" ADD CONSTRAINT "career_offerings_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_cutoffs" ADD CONSTRAINT "offering_cutoffs_offering_id_career_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."career_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_weights" ADD CONSTRAINT "offering_weights_offering_id_career_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."career_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_goal_buffers" ADD CONSTRAINT "student_goal_buffers_goal_id_student_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."student_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_goal_scores" ADD CONSTRAINT "student_goal_scores_goal_id_student_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."student_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_goals" ADD CONSTRAINT "student_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_goals" ADD CONSTRAINT "student_goals_offering_id_career_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."career_offerings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admissions_datasets_active" ON "admissions_datasets" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_career_offerings_dataset_uni_career" ON "career_offerings" USING btree ("dataset_id","university_id","career_id");--> statement-breakpoint
CREATE INDEX "idx_career_offerings_dataset" ON "career_offerings" USING btree ("dataset_id");--> statement-breakpoint
CREATE INDEX "idx_careers_name" ON "careers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_offering_cutoffs_offering_year" ON "offering_cutoffs" USING btree ("offering_id","admission_year");--> statement-breakpoint
CREATE INDEX "idx_offering_cutoffs_offering" ON "offering_cutoffs" USING btree ("offering_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_offering_weights_offering_test" ON "offering_weights" USING btree ("offering_id","test_code");--> statement-breakpoint
CREATE INDEX "idx_offering_weights_offering" ON "offering_weights" USING btree ("offering_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_goal_buffers_goal" ON "student_goal_buffers" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "idx_student_goal_buffers_goal" ON "student_goal_buffers" USING btree ("goal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_goal_scores_goal_test" ON "student_goal_scores" USING btree ("goal_id","test_code");--> statement-breakpoint
CREATE INDEX "idx_student_goal_scores_goal" ON "student_goal_scores" USING btree ("goal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_goals_user_priority" ON "student_goals" USING btree ("user_id","priority");--> statement-breakpoint
CREATE INDEX "idx_student_goals_user" ON "student_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_universities_name" ON "universities" USING btree ("name");