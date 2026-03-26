ALTER TABLE "atom_study_responses" DROP CONSTRAINT "atom_study_responses_question_id_generated_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "atom_study_responses" ADD COLUMN "atom_id" varchar(50);--> statement-breakpoint
ALTER TABLE "atom_study_responses" ADD CONSTRAINT "atom_study_responses_atom_id_atoms_id_fk" FOREIGN KEY ("atom_id") REFERENCES "public"."atoms"("id") ON DELETE no action ON UPDATE no action;