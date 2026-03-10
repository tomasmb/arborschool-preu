CREATE TYPE "public"."review_result" AS ENUM('pass', 'fail');--> statement-breakpoint
CREATE TYPE "public"."session_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('lesson', 'in_progress', 'mastered', 'failed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('mastery', 'prereq_scan', 'review');--> statement-breakpoint
CREATE TABLE "atom_study_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" varchar(100) NOT NULL,
	"position" integer NOT NULL,
	"difficulty_level" "session_difficulty" NOT NULL,
	"selected_answer" varchar(10),
	"is_correct" boolean,
	"response_time_seconds" integer,
	"answered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "atom_study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"atom_id" varchar(50) NOT NULL,
	"session_type" "session_type" DEFAULT 'mastery' NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" "session_status" DEFAULT 'lesson' NOT NULL,
	"current_difficulty" "session_difficulty" DEFAULT 'easy' NOT NULL,
	"easy_streak" integer DEFAULT 0 NOT NULL,
	"medium_streak" integer DEFAULT 0 NOT NULL,
	"hard_streak" integer DEFAULT 0 NOT NULL,
	"consecutive_correct" integer DEFAULT 0 NOT NULL,
	"consecutive_incorrect" integer DEFAULT 0 NOT NULL,
	"hard_correct_in_streak" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"correct_questions" integer DEFAULT 0 NOT NULL,
	"lesson_viewed_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "atom_mastery" ADD COLUMN "cooldown_until_mastery_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "atom_mastery" ADD COLUMN "next_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "atom_mastery" ADD COLUMN "review_interval_sessions" integer;--> statement-breakpoint
ALTER TABLE "atom_mastery" ADD COLUMN "sessions_since_last_review" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "atom_mastery" ADD COLUMN "total_reviews" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "atom_mastery" ADD COLUMN "last_review_result" "review_result";--> statement-breakpoint
ALTER TABLE "atom_study_responses" ADD CONSTRAINT "atom_study_responses_session_id_atom_study_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."atom_study_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atom_study_responses" ADD CONSTRAINT "atom_study_responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atom_study_sessions" ADD CONSTRAINT "atom_study_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atom_study_sessions" ADD CONSTRAINT "atom_study_sessions_atom_id_atoms_id_fk" FOREIGN KEY ("atom_id") REFERENCES "public"."atoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_atom_study_responses_session" ON "atom_study_responses" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_atom_study_responses_session_position" ON "atom_study_responses" USING btree ("session_id","position");--> statement-breakpoint
CREATE INDEX "idx_atom_study_sessions_user" ON "atom_study_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_atom_study_sessions_user_atom" ON "atom_study_sessions" USING btree ("user_id","atom_id");--> statement-breakpoint
CREATE INDEX "idx_atom_study_sessions_status" ON "atom_study_sessions" USING btree ("status");