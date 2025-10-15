CREATE TYPE "public"."visibility_type" AS ENUM('public', 'private', 'readonly', 'admin-shared');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" varchar DEFAULT 'user';
