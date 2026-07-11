CREATE TABLE "top_friends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"friend_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "top_friends" ADD CONSTRAINT "top_friends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_friends" ADD CONSTRAINT "top_friends_friend_id_users_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "top_friends_user_friend_unique" ON "top_friends" USING btree ("user_id","friend_id");--> statement-breakpoint
CREATE UNIQUE INDEX "top_friends_user_order_unique" ON "top_friends" USING btree ("user_id","order");