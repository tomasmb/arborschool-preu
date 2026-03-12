CREATE TABLE "student_planning_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exam_date" date,
	"weekly_minutes_target" integer DEFAULT 360 NOT NULL,
	"timezone" varchar(80) DEFAULT 'America/Santiago' NOT NULL,
	"reminder_in_app" boolean DEFAULT true NOT NULL,
	"reminder_email" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_reminder_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" varchar(20) DEFAULT 'email' NOT NULL,
	"job_type" varchar(40) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"dedupe_key" varchar(180) NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"payload" jsonb,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_study_sprint_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sprint_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"atom_id" varchar(50) NOT NULL,
	"question_id" varchar(100) NOT NULL,
	"prompt_label" varchar(160),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_study_sprint_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sprint_id" uuid NOT NULL,
	"sprint_item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"selected_answer" varchar(50) NOT NULL,
	"is_correct" boolean NOT NULL,
	"response_time_seconds" integer,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_study_sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"source" varchar(30) DEFAULT 'next_action' NOT NULL,
	"estimated_minutes" integer DEFAULT 25 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_weekly_missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"target_sessions" integer DEFAULT 5 NOT NULL,
	"completed_sessions" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_progress_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "student_planning_profiles" ADD CONSTRAINT "student_planning_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_reminder_jobs" ADD CONSTRAINT "student_reminder_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_study_sprint_items" ADD CONSTRAINT "student_study_sprint_items_sprint_id_student_study_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."student_study_sprints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_study_sprint_items" ADD CONSTRAINT "student_study_sprint_items_atom_id_atoms_id_fk" FOREIGN KEY ("atom_id") REFERENCES "public"."atoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_study_sprint_items" ADD CONSTRAINT "student_study_sprint_items_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_study_sprint_responses" ADD CONSTRAINT "student_study_sprint_responses_sprint_id_student_study_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."student_study_sprints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_study_sprint_responses" ADD CONSTRAINT "student_study_sprint_responses_sprint_item_id_student_study_sprint_items_id_fk" FOREIGN KEY ("sprint_item_id") REFERENCES "public"."student_study_sprint_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_study_sprint_responses" ADD CONSTRAINT "student_study_sprint_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_study_sprints" ADD CONSTRAINT "student_study_sprints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_weekly_missions" ADD CONSTRAINT "student_weekly_missions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_planning_profiles_user" ON "student_planning_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_student_planning_profiles_user" ON "student_planning_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_reminder_jobs_dedupe_key" ON "student_reminder_jobs" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "idx_student_reminder_jobs_user" ON "student_reminder_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_student_reminder_jobs_status" ON "student_reminder_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_student_reminder_jobs_schedule" ON "student_reminder_jobs" USING btree ("scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_study_sprint_items_sprint_position" ON "student_study_sprint_items" USING btree ("sprint_id","position");--> statement-breakpoint
CREATE INDEX "idx_student_study_sprint_items_sprint" ON "student_study_sprint_items" USING btree ("sprint_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_study_sprint_responses_item_user" ON "student_study_sprint_responses" USING btree ("sprint_item_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_student_study_sprint_responses_sprint" ON "student_study_sprint_responses" USING btree ("sprint_id");--> statement-breakpoint
CREATE INDEX "idx_student_study_sprint_responses_user" ON "student_study_sprint_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_student_study_sprints_user" ON "student_study_sprints" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_student_study_sprints_status" ON "student_study_sprints" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_student_study_sprints_user_status" ON "student_study_sprints" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_weekly_missions_user_week_start" ON "student_weekly_missions" USING btree ("user_id","week_start_date");--> statement-breakpoint
CREATE INDEX "idx_student_weekly_missions_user" ON "student_weekly_missions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_student_weekly_missions_status" ON "student_weekly_missions" USING btree ("status");