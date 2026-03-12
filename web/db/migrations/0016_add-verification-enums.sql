ALTER TYPE "public"."mastery_status" ADD VALUE 'needs_verification' BEFORE 'frozen';--> statement-breakpoint
ALTER TYPE "public"."session_type" ADD VALUE 'verification';