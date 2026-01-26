-- Add composite index for question lookup by source test ID and question number
-- This index is used by /api/diagnostic/question (called 16 times per test)
-- Reduces query from full table scan (~300 rows) to index seek (1 row)

CREATE INDEX idx_questions_source_lookup 
  ON questions (source_test_id, source_question_number);
