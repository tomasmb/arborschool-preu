-- Student could not complete mastery on a root atom (no prerequisites);
-- stop offering repeat sessions to avoid frustration loops.

DO $$ BEGIN
  ALTER TYPE "public"."mastery_status" ADD VALUE 'blocked_cannot_pass_base';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
