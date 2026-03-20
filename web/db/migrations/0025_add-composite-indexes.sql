CREATE INDEX "idx_generated_questions_atom_diff" ON "generated_questions" USING btree ("atom_id","difficulty_level");--> statement-breakpoint
CREATE INDEX "idx_atom_mastery_user_mastered" ON "atom_mastery" USING btree ("user_id","is_mastered");--> statement-breakpoint
CREATE INDEX "idx_atom_mastery_user_status" ON "atom_mastery" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_test_attempts_user_completed" ON "test_attempts" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "idx_atom_study_sessions_user_type" ON "atom_study_sessions" USING btree ("user_id","session_type");--> statement-breakpoint
CREATE INDEX "idx_student_reminder_jobs_dispatch" ON "student_reminder_jobs" USING btree ("channel","status","scheduled_for");