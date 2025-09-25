CREATE TABLE "agent_user_permission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"granted_by" uuid NOT NULL,
	"granted_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"permission_level" varchar DEFAULT 'use' NOT NULL,
	CONSTRAINT "agent_user_permission_agent_id_user_id_unique" UNIQUE("agent_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "agent_user_permission" ADD CONSTRAINT "agent_user_permission_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_user_permission" ADD CONSTRAINT "agent_user_permission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_user_permission" ADD CONSTRAINT "agent_user_permission_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_user_permission_agent_id" ON "agent_user_permission" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_user_permission_user_id" ON "agent_user_permission" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_agent_user_permission_granted_by" ON "agent_user_permission" USING btree ("granted_by");