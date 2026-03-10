-- Remove duplicate (attempt, question) rows keeping the most recent answer
DELETE FROM "student_responses"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id",
      ROW_NUMBER() OVER (
        PARTITION BY "test_attempt_id", "question_id"
        ORDER BY "answered_at" DESC
      ) AS rn
    FROM "student_responses"
    WHERE "question_id" IS NOT NULL
  ) sub
  WHERE rn > 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_student_responses_attempt_question" ON "student_responses" USING btree ("test_attempt_id","question_id");