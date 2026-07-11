CREATE TABLE "audience_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"member_ids" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"place_name" text,
	"accuracy_meters" double precision,
	"shared_with_list_id" uuid,
	"excluded_friend_ids" text[] DEFAULT '{}' NOT NULL,
	"enabled" text DEFAULT 'true' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"votes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"streak_type" text NOT NULL,
	"current_count" integer DEFAULT 0 NOT NULL,
	"longest_count" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp with time zone,
	"next_reset_at" timestamp with time zone,
	"frozen_days" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "profile_song_id" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "profile_song_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "remix_of" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "duet_of" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "audience" text DEFAULT 'everyone' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "audience_list_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "collab_request_status" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "second_author_id" uuid;--> statement-breakpoint
ALTER TABLE "audience_lists" ADD CONSTRAINT "audience_lists_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_shared_with_list_id_audience_lists_id_fk" FOREIGN KEY ("shared_with_list_id") REFERENCES "public"."audience_lists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "audience_lists_owner_name_unique" ON "audience_lists" USING btree ("owner_id","name");--> statement-breakpoint
CREATE INDEX "locations_user_id_idx" ON "locations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "locations_expires_at_idx" ON "locations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "locations_shared_with_list_id_idx" ON "locations" USING btree ("shared_with_list_id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_second_author_id_users_id_fk" FOREIGN KEY ("second_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;