DROP INDEX "ux_career_offerings_dataset_uni_career";--> statement-breakpoint
ALTER TABLE "career_offerings" ADD COLUMN "location" varchar(120);--> statement-breakpoint
CREATE UNIQUE INDEX "ux_career_offerings_dataset_uni_career_loc" ON "career_offerings" USING btree ("dataset_id","university_id","career_id","location");