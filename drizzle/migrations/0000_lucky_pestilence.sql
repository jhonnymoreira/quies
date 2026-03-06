CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'completed', 'canceled');--> statement-breakpoint
CREATE TABLE "appointments_services" (
	"appointment_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"medspa_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"duration" integer NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "appointments_services_appointment_id_service_id_pk" PRIMARY KEY("appointment_id","service_id"),
	CONSTRAINT "appointments_services_price_positive" CHECK ("appointments_services"."price" > 0),
	CONSTRAINT "appointments_services_duration_positive" CHECK ("appointments_services"."duration" > 0)
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medspa_id" uuid NOT NULL,
	"start_time" timestamp (3) with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"total_duration" integer NOT NULL,
	"total_price" integer NOT NULL,
	"scheduled_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp (3) with time zone,
	"canceled_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "appointments_id_medspa_id_unique" UNIQUE("id","medspa_id"),
	CONSTRAINT "appointments_total_duration_positive" CHECK ("appointments"."total_duration" > 0),
	CONSTRAINT "appointments_total_price_positive" CHECK ("appointments"."total_price" > 0),
	CONSTRAINT "appointments_status_scheduled_consistency" CHECK ("appointments"."status" != 'scheduled' OR ("appointments"."scheduled_at" IS NOT NULL AND "appointments"."completed_at" IS NULL AND "appointments"."canceled_at" IS NULL)),
	CONSTRAINT "appointments_status_completed_consistency" CHECK ("appointments"."status" != 'completed' OR ("appointments"."scheduled_at" IS NOT NULL AND "appointments"."completed_at" IS NOT NULL AND "appointments"."canceled_at" IS NULL)),
	CONSTRAINT "appointments_status_canceled_consistency" CHECK ("appointments"."status" != 'canceled' OR ("appointments"."scheduled_at" IS NOT NULL AND "appointments"."completed_at" IS NULL AND "appointments"."canceled_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "medspas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(300) NOT NULL,
	"phone_number" varchar(16) NOT NULL,
	"email" varchar(254) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "medspas_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"duration" integer NOT NULL,
	"medspa_id" uuid NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	CONSTRAINT "services_medspa_id_name_unique" UNIQUE("medspa_id","name"),
	CONSTRAINT "services_id_medspa_id_unique" UNIQUE("id","medspa_id")
);
--> statement-breakpoint
ALTER TABLE "appointments_services" ADD CONSTRAINT "appointments_services_appointment_fk" FOREIGN KEY ("appointment_id","medspa_id") REFERENCES "public"."appointments"("id","medspa_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments_services" ADD CONSTRAINT "appointments_services_service_fk" FOREIGN KEY ("service_id","medspa_id") REFERENCES "public"."services"("id","medspa_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_medspa_id_medspas_id_fk" FOREIGN KEY ("medspa_id") REFERENCES "public"."medspas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_medspa_id_medspas_id_fk" FOREIGN KEY ("medspa_id") REFERENCES "public"."medspas"("id") ON DELETE no action ON UPDATE no action;