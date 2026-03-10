ALTER TABLE "atom_study_responses" DROP CONSTRAINT "atom_study_responses_question_id_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "atom_study_responses" ALTER COLUMN "question_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "atom_study_responses" ADD CONSTRAINT "atom_study_responses_question_id_generated_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."generated_questions"("id") ON DELETE no action ON UPDATE no action;