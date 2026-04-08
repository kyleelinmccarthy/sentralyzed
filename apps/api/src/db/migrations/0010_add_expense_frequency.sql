-- Add expense frequency enum and column
CREATE TYPE "public"."expense_frequency" AS ENUM('one_time', 'monthly', 'quarterly', 'annually');

ALTER TABLE "expenses" ADD COLUMN "frequency" "expense_frequency" DEFAULT 'one_time' NOT NULL;
