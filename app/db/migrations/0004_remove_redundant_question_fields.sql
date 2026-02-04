-- Remove redundant fields from questions table
-- These fields are now either:
-- 1. Parsed from qtiXml (correctAnswer)
-- 2. Unused (difficultyAnalysis, generalAnalysis)
-- 3. Data was incorrect and will be regenerated later (feedback fields)
--
-- qtiXml is now the single source of truth for question content and correct answer

ALTER TABLE questions DROP COLUMN IF EXISTS correct_answer;
--> statement-breakpoint
ALTER TABLE questions DROP COLUMN IF EXISTS difficulty_analysis;
--> statement-breakpoint
ALTER TABLE questions DROP COLUMN IF EXISTS general_analysis;
--> statement-breakpoint
ALTER TABLE questions DROP COLUMN IF EXISTS feedback_general;
--> statement-breakpoint
ALTER TABLE questions DROP COLUMN IF EXISTS feedback_per_option;
