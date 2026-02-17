-- Migration: generated_questions
-- Creates the generated_questions table, drops question_sets, and cleans up
-- related columns/enums as specified in generated-questions-schema-spec.md.

-- Step 1: Add enrichment column to atoms (idempotent, may already exist)
ALTER TABLE "atoms" ADD COLUMN IF NOT EXISTS "enrichment" jsonb;

-- Step 2: Create the generated_questions table
CREATE TABLE "generated_questions" (
  "id" text PRIMARY KEY NOT NULL,
  "atom_id" text NOT NULL,
  "qti_xml" text NOT NULL,
  "difficulty_level" "difficulty_level" NOT NULL,
  "component_tag" text NOT NULL,
  "operation_skeleton_ast" text NOT NULL,
  "surface_context" text NOT NULL DEFAULT 'pure_math',
  "numbers_profile" text NOT NULL DEFAULT 'small_integers',
  "fingerprint" text NOT NULL,
  "validators" jsonb NOT NULL,
  "target_exemplar_id" text,
  "distance_level" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_generated_questions_atom"
  ON "generated_questions" USING btree ("atom_id");
--> statement-breakpoint
ALTER TABLE "generated_questions"
  ADD CONSTRAINT "generated_questions_atom_id_atoms_id_fk"
  FOREIGN KEY ("atom_id") REFERENCES "public"."atoms"("id")
  ON DELETE no action ON UPDATE no action;

-- Step 3: Clean up generated-question rows from the official questions table.
-- Remove question_atoms junction rows for pipeline-generated questions first
-- (FK cascade would handle this, but being explicit).
--> statement-breakpoint
DELETE FROM "question_atoms"
WHERE "question_id" IN (
  SELECT "id" FROM "questions" WHERE "source" = 'question_set'
);
--> statement-breakpoint
DELETE FROM "questions" WHERE "source" = 'question_set';

-- Step 4: Drop question_set_id FK from questions and lessons
--> statement-breakpoint
ALTER TABLE "questions"
  DROP CONSTRAINT IF EXISTS "questions_question_set_id_question_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "questions"
  DROP COLUMN IF EXISTS "question_set_id";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_questions_question_set";
--> statement-breakpoint
ALTER TABLE "lessons"
  DROP CONSTRAINT IF EXISTS "lessons_question_set_id_question_sets_id_fk";
--> statement-breakpoint
ALTER TABLE "lessons"
  DROP COLUMN IF EXISTS "question_set_id";

-- Step 5: Drop the question_sets table
--> statement-breakpoint
DROP TABLE IF EXISTS "question_sets";

-- Step 6: Clean up enums
-- Remove 'question_set' from question_source enum (requires recreate in Postgres)
--> statement-breakpoint
ALTER TYPE "question_source" RENAME TO "question_source_old";
--> statement-breakpoint
CREATE TYPE "question_source" AS ENUM('official', 'alternate');
--> statement-breakpoint
ALTER TABLE "questions"
  ALTER COLUMN "source" TYPE "question_source"
  USING "source"::text::"question_source";
--> statement-breakpoint
DROP TYPE "question_source_old";
--> statement-breakpoint
DROP TYPE IF EXISTS "question_set_status";
