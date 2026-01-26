DROP INDEX IF EXISTS "idx_student_responses_question";--> statement-breakpoint
ALTER TABLE "student_responses" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_responses" ALTER COLUMN "question_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_responses" ALTER COLUMN "test_attempt_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "test_attempts" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "test_attempts" ALTER COLUMN "test_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_responses" ADD COLUMN IF NOT EXISTS "stage" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "student_responses" ADD COLUMN IF NOT EXISTS "question_index" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_student_responses_attempt" ON "student_responses" USING btree ("test_attempt_id");
