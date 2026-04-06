-- Add budgetId to expenses to link expenses to budgets
ALTER TABLE "expenses" ADD COLUMN "budget_id" uuid REFERENCES "budgets"("id");

-- Add clientId to budgets to scope budgets to clients
ALTER TABLE "budgets" ADD COLUMN "client_id" uuid REFERENCES "clients"("id");
