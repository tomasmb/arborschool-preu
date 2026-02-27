ALTER TABLE "lessons" ADD COLUMN "lesson_html" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "worked_example_html";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "explanation_html";--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "lesson_html" DROP DEFAULT;
