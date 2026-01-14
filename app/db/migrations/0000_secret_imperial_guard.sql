CREATE TYPE "public"."atom_relevance" AS ENUM('primary', 'secondary');--> statement-breakpoint
CREATE TYPE "public"."atom_type" AS ENUM('concepto', 'procedimiento', 'representacion', 'concepto_procedimental', 'modelizacion', 'argumentacion');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."mastery_source" AS ENUM('diagnostic', 'practice_test', 'pp100');--> statement-breakpoint
CREATE TYPE "public"."mastery_status" AS ENUM('not_started', 'in_progress', 'mastered', 'frozen');--> statement-breakpoint
CREATE TYPE "public"."question_set_status" AS ENUM('pending', 'generated', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."question_source" AS ENUM('official', 'alternate', 'question_set');--> statement-breakpoint
CREATE TYPE "public"."skill_type" AS ENUM('representar', 'resolver_problemas', 'modelar', 'argumentar');--> statement-breakpoint
CREATE TYPE "public"."test_type" AS ENUM('official', 'diagnostic', 'practice');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'admin');--> statement-breakpoint
CREATE TABLE "atoms" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"subject_id" varchar(50),
	"axis" varchar(50) NOT NULL,
	"standard_ids" varchar(50)[] NOT NULL,
	"atom_type" "atom_type" NOT NULL,
	"primary_skill" "skill_type" NOT NULL,
	"secondary_skills" "skill_type"[],
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"mastery_criteria" jsonb NOT NULL,
	"conceptual_examples" jsonb,
	"scope_notes" jsonb,
	"prerequisite_ids" varchar(50)[],
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"atom_id" varchar(50) NOT NULL,
	"question_set_id" varchar(100),
	"title" varchar(255) NOT NULL,
	"worked_example_html" text NOT NULL,
	"explanation_html" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "lessons_atom_id_unique" UNIQUE("atom_id")
);
--> statement-breakpoint
CREATE TABLE "question_atoms" (
	"question_id" varchar(100) NOT NULL,
	"atom_id" varchar(50) NOT NULL,
	"relevance" "atom_relevance" NOT NULL,
	"reasoning" text,
	CONSTRAINT "question_atoms_question_id_atom_id_pk" PRIMARY KEY("question_id","atom_id")
);
--> statement-breakpoint
CREATE TABLE "question_sets" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"atom_id" varchar(50) NOT NULL,
	"status" "question_set_status" DEFAULT 'pending' NOT NULL,
	"low_count" integer DEFAULT 0,
	"medium_count" integer DEFAULT 0,
	"high_count" integer DEFAULT 0,
	"generated_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "question_sets_atom_id_unique" UNIQUE("atom_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"source" "question_source" NOT NULL,
	"parent_question_id" varchar(100),
	"question_set_id" varchar(100),
	"qti_xml" text NOT NULL,
	"title" varchar(255),
	"correct_answer" varchar(50) NOT NULL,
	"difficulty_level" "difficulty_level" NOT NULL,
	"difficulty_score" numeric(3, 2),
	"difficulty_analysis" text,
	"general_analysis" text,
	"feedback_general" text,
	"feedback_per_option" jsonb,
	"source_test_id" varchar(100),
	"source_question_number" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "standards" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"subject_id" varchar(50),
	"axis" varchar(50) NOT NULL,
	"unit" varchar(255),
	"title" varchar(255) NOT NULL,
	"description" text,
	"includes" jsonb,
	"excludes" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_name" varchar(50) NOT NULL,
	"description" text,
	"admission_year" integer,
	"application_types" varchar(100)[],
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_questions" (
	"test_id" varchar(100) NOT NULL,
	"question_id" varchar(100) NOT NULL,
	"position" integer NOT NULL,
	"stage" integer DEFAULT 1,
	CONSTRAINT "test_questions_test_id_question_id_pk" PRIMARY KEY("test_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"subject_id" varchar(50),
	"test_type" "test_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"admission_year" integer,
	"application_type" varchar(50),
	"question_count" integer NOT NULL,
	"time_limit_minutes" integer,
	"is_adaptive" boolean DEFAULT false,
	"stages" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "atom_mastery" (
	"user_id" uuid NOT NULL,
	"atom_id" varchar(50) NOT NULL,
	"status" "mastery_status" DEFAULT 'not_started' NOT NULL,
	"is_mastered" boolean DEFAULT false NOT NULL,
	"mastery_source" "mastery_source",
	"first_mastered_at" timestamp with time zone,
	"last_demonstrated_at" timestamp with time zone,
	"current_streak" integer DEFAULT 0,
	"total_attempts" integer DEFAULT 0,
	"correct_attempts" integer DEFAULT 0,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "atom_mastery_user_id_atom_id_pk" PRIMARY KEY("user_id","atom_id")
);
--> statement-breakpoint
CREATE TABLE "student_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" varchar(100) NOT NULL,
	"test_attempt_id" uuid,
	"selected_answer" varchar(50) NOT NULL,
	"is_correct" boolean NOT NULL,
	"response_time_seconds" integer,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_id" varchar(100) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"total_questions" integer,
	"correct_answers" integer,
	"score_percentage" numeric(5, 2),
	"stage_1_score" integer,
	"stage_2_difficulty" varchar(20),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"subscription_status" varchar(50),
	"subscription_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "atoms" ADD CONSTRAINT "atoms_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_atom_id_atoms_id_fk" FOREIGN KEY ("atom_id") REFERENCES "public"."atoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_question_set_id_question_sets_id_fk" FOREIGN KEY ("question_set_id") REFERENCES "public"."question_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_atoms" ADD CONSTRAINT "question_atoms_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_atoms" ADD CONSTRAINT "question_atoms_atom_id_atoms_id_fk" FOREIGN KEY ("atom_id") REFERENCES "public"."atoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_atom_id_atoms_id_fk" FOREIGN KEY ("atom_id") REFERENCES "public"."atoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_set_id_question_sets_id_fk" FOREIGN KEY ("question_set_id") REFERENCES "public"."question_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standards" ADD CONSTRAINT "standards_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atom_mastery" ADD CONSTRAINT "atom_mastery_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atom_mastery" ADD CONSTRAINT "atom_mastery_atom_id_atoms_id_fk" FOREIGN KEY ("atom_id") REFERENCES "public"."atoms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_test_attempt_id_test_attempts_id_fk" FOREIGN KEY ("test_attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_atoms_subject" ON "atoms" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_atoms_axis" ON "atoms" USING btree ("axis");--> statement-breakpoint
CREATE INDEX "idx_question_atoms_atom" ON "question_atoms" USING btree ("atom_id");--> statement-breakpoint
CREATE INDEX "idx_questions_source" ON "questions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_questions_difficulty" ON "questions" USING btree ("difficulty_level");--> statement-breakpoint
CREATE INDEX "idx_questions_question_set" ON "questions" USING btree ("question_set_id");--> statement-breakpoint
CREATE INDEX "idx_test_questions_position" ON "test_questions" USING btree ("test_id","position");--> statement-breakpoint
CREATE INDEX "idx_atom_mastery_user" ON "atom_mastery" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_atom_mastery_status" ON "atom_mastery" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_student_responses_user" ON "student_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_student_responses_question" ON "student_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_test_attempts_user" ON "test_attempts" USING btree ("user_id");