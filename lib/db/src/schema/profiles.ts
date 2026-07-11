import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { usersTable, type User } from './users';

export type Visibility = 'everyone' | 'friends' | 'onlyMe';

export type ModuleId = 'about' | 'topFriends' | 'mood' | 'posts';

export interface ProfileModule {
  id: ModuleId;
  visible: boolean;
  visibility: Visibility;
  order: number;
  data?: Record<string, unknown>;
}

export const profilesTable = pgTable('profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  handle: text('handle').notNull().unique(),
  name: text('name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  wallpaper: text('wallpaper'),
  accentColor: text('accent_color'),
  moodLabel: text('mood_label'),
  moodIcon: text('mood_icon'),
  nowPlaying: text('now_playing'),
  moduleSettings: jsonb('module_settings').$type<ProfileModule[]>().notNull().default([]),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
});

// Zod schema for module settings (for API validation layer)
// This can be used in API routes to validate module structure
export const profileModuleSchema: z.ZodType<ProfileModule> = z.object({
  id: z.enum(['about', 'topFriends', 'mood', 'posts']),
  visible: z.boolean(),
  visibility: z.enum(['everyone', 'friends', 'onlyMe']),
  order: z.number(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  userId: true,
  joinedAt: true,
});

export const selectProfileSchema = createSelectSchema(profilesTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertProfile = Omit<typeof profilesTable.$inferInsert, 'userId' | 'joinedAt'>;
export type Profile = typeof profilesTable.$inferSelect;

// Combined user + profile type for convenience
export type UserProfile = User & Profile;
