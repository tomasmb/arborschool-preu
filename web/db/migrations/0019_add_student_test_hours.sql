CREATE TABLE "student_test_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_code" varchar(10) NOT NULL,
	"weekly_minutes" integer DEFAULT 180 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "student_test_hours" ADD CONSTRAINT "student_test_hours_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_student_test_hours_user_test" ON "student_test_hours" USING btree ("user_id","test_code");--> statement-breakpoint
CREATE INDEX "idx_student_test_hours_user" ON "student_test_hours" USING btree ("user_id");