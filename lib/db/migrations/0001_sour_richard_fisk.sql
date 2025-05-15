CREATE TABLE "verida_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider_id" text NOT NULL,
	"account_id" text,
	"sync_status" text DEFAULT 'ok' NOT NULL,
	"last_sync" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verida_connections" ADD CONSTRAINT "verida_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;