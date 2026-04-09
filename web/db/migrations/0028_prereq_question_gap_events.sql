-- Prerequisite atoms without generated medium/high questions cannot be verified in scan.
-- Track per-(user, target, base) for pilot analytics.

DO $$ BEGIN
  ALTER TYPE "public"."mastery_status" ADD VALUE 'blocked_prereq_no_questions';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "prereq_question_gap_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "target_atom_id" varchar(50) NOT NULL REFERENCES "atoms"("id"),
  "base_atom_id" varchar(50) NOT NULL REFERENCES "atoms"("id"),
  "created_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "uq_prereq_gap_user_target_base"
  ON "prereq_question_gap_events" ("user_id", "target_atom_id", "base_atom_id");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_prereq_gap_base_atom"
  ON "prereq_question_gap_events" ("base_atom_id");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_prereq_gap_user"
  ON "prereq_question_gap_events" ("user_id");
