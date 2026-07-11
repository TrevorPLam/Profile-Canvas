import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { usersTable } from './users';

export type LiveStreamStatus = 'pending' | 'active' | 'ended' | 'failed';

export const liveStreamsTable = pgTable('live_streams', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostId: uuid('host_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  streamKey: text('stream_key').notNull().unique(),
  status: text('status').notNull().$type<LiveStreamStatus>(),
  viewerCount: integer('viewer_count').notNull().default(0),
  rtmpUrl: text('rtmp_url').notNull(),
  playbackUrl: text('playback_url').notNull(),
  replayUrl: text('replay_url'),
  title: text('title').notNull(),
  description: text('description'),
  enableRecording: text('enable_recording').notNull().default('true').$type<'true' | 'false'>(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertLiveStreamSchema = createInsertSchema(liveStreamsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectLiveStreamSchema = createSelectSchema(liveStreamsTable);

// Use Drizzle's built-in type inference to avoid Zod compatibility issues
export type InsertLiveStream = Omit<typeof liveStreamsTable.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
export type LiveStream = typeof liveStreamsTable.$inferSelect;
