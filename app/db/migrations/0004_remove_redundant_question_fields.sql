ALTER TABLE questions DROP COLUMN IF EXISTS correct_answer;
--> statement-breakpoint
ALTER TABLE questions DROP COLUMN IF EXISTS difficulty_analysis;
--> statement-breakpoint
ALTER TABLE questions DROP COLUMN IF EXISTS general_analysis;
--> statement-breakpoint
ALTER TABLE questions DROP COLUMN IF EXISTS feedback_general;
--> statement-breakpoint
ALTER TABLE questions DROP COLUMN IF EXISTS feedback_per_option;
