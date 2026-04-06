CREATE TYPE "public"."attendee_requirement" AS ENUM('required', 'optional');--> statement-breakpoint
CREATE TYPE "public"."client_project_role" AS ENUM('sponsor', 'stakeholder', 'end_user');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('lead', 'active', 'inactive', 'churned');--> statement-breakpoint
CREATE TYPE "public"."budget_period" AS ENUM('monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('advertising', 'bank_fees', 'contract_labor', 'education_training', 'equipment', 'insurance', 'meals', 'office_supplies', 'professional_services', 'rent_lease', 'software_subscriptions', 'taxes_licenses', 'travel', 'utilities', 'wages', 'other');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."asset_category" AS ENUM('laptop', 'monitor', 'phone', 'tablet', 'peripheral', 'furniture', 'vehicle', 'software_license', 'equipment', 'other');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('available', 'in_use', 'maintenance', 'retired');--> statement-breakpoint
ALTER TYPE "public"."poll_context_type" ADD VALUE 'task';--> statement-breakpoint
ALTER TYPE "public"."poll_context_type" ADD VALUE 'client';--> statement-breakpoint
ALTER TYPE "public"."poll_context_type" ADD VALUE 'expense';--> statement-breakpoint
ALTER TYPE "public"."poll_context_type" ADD VALUE 'calendar';--> statement-breakpoint
ALTER TYPE "public"."poll_context_type" ADD VALUE 'user';--> statement-breakpoint
ALTER TYPE "public"."poll_context_type" ADD VALUE 'whiteboard';--> statement-breakpoint
ALTER TYPE "public"."poll_context_type" ADD VALUE 'feedback';--> statement-breakpoint
ALTER TYPE "public"."poll_context_type" ADD VALUE 'asset';--> statement-breakpoint
CREATE TABLE "client_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"role" "client_project_role" DEFAULT 'stakeholder' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"notes" text,
	"status" "client_status" DEFAULT 'lead' NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "entity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" varchar(20) NOT NULL,
	"source_id" uuid NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"target_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount_cents" integer NOT NULL,
	"period_type" "budget_period" NOT NULL,
	"category" "expense_category",
	"project_id" uuid,
	"client_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" varchar(500) NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"category" "expense_category" NOT NULL,
	"custom_label" varchar(100),
	"receipt_url" text,
	"project_id" uuid,
	"client_id" uuid,
	"budget_id" uuid,
	"asset_id" uuid,
	"tax_deductible" boolean DEFAULT true NOT NULL,
	"date" date NOT NULL,
	"vendor" varchar(255),
	"notes" text,
	"status" "expense_status" DEFAULT 'pending' NOT NULL,
	"submitted_by" uuid NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "asset_category" NOT NULL,
	"status" "asset_status" DEFAULT 'available' NOT NULL,
	"serial_number" varchar(255),
	"purchase_cost_cents" integer,
	"purchase_date" date,
	"warranty_expires_at" timestamp with time zone,
	"assigned_to_id" uuid,
	"project_id" uuid,
	"client_id" uuid,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pinned_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" uuid NOT NULL,
	"pinned_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whiteboards" ADD COLUMN "shapes_data" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD COLUMN "requirement" "attendee_requirement" DEFAULT 'required' NOT NULL;--> statement-breakpoint
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_projects" ADD CONSTRAINT "client_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_links" ADD CONSTRAINT "entity_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_pinned_by_users_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entity_link_unique" ON "entity_links" USING btree ("source_type","source_id","target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pinned_entity_unique" ON "pinned_messages" USING btree ("entity_type","entity_id");