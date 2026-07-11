import { z } from 'zod';

/**
 * Health check response schema
 */
export const HealthCheckResponseSchema = z.object({
  status: z.string(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

/**
 * Auth request/response schemas
 */
export const RegisterBodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type RegisterBody = z.infer<typeof RegisterBodySchema>;

export const LoginBodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

export type LoginBody = z.infer<typeof LoginBodySchema>;

export const GetMeResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    emailVerified: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  profile: z.object({
    userId: z.string(),
    handle: z.string(),
    name: z.string(),
    bio: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    wallpaper: z.string().nullable(),
    accentColor: z.string().nullable(),
    moodLabel: z.string().nullable(),
    moodIcon: z.string().nullable(),
    nowPlaying: z.string().nullable(),
    moduleSettings: z.array(z.unknown()),
    joinedAt: z.string(),
  }),
});

export type GetMeResponse = z.infer<typeof GetMeResponseSchema>;

/**
 * Post content schemas
 */
export const TextPostContentSchema = z.object({
  kind: z.literal('text'),
  text: z.string(),
});

export type TextPostContent = z.infer<typeof TextPostContentSchema>;

export const VideoPostContentSchema = z.object({
  kind: z.literal('video'),
  title: z.string(),
  thumbnailUrl: z.string(),
  durationLabel: z.string(),
  viewsLabel: z.string(),
});

export type VideoPostContent = z.infer<typeof VideoPostContentSchema>;

export const ReelPostContentSchema = z.object({
  kind: z.literal('reel'),
  caption: z.string(),
  thumbnailUrl: z.string(),
  soundLabel: z.string(),
  viewsLabel: z.string(),
});

export type ReelPostContent = z.infer<typeof ReelPostContentSchema>;

export const CreatePostBodySchema = z.discriminatedUnion('kind', [
  TextPostContentSchema,
  VideoPostContentSchema,
  ReelPostContentSchema,
]);

export type CreatePostBody = z.infer<typeof CreatePostBodySchema>;

export const CreatePostResponseSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  kind: z.enum(['text', 'video', 'reel']),
  content: z.union([TextPostContentSchema, VideoPostContentSchema, ReelPostContentSchema]),
  repostOf: z
    .object({
      originalPostId: z.string(),
      originalAuthorId: z.string(),
    })
    .nullable(),
  topics: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type CreatePostResponse = z.infer<typeof CreatePostResponseSchema>;

export const ListPostsResponseSchema = z.object({
  posts: z.array(CreatePostResponseSchema),
});

export type ListPostsResponse = z.infer<typeof ListPostsResponseSchema>;

export const GetPostResponseSchema = CreatePostResponseSchema;

export type GetPostResponse = z.infer<typeof GetPostResponseSchema>;

export const RepostPostResponseSchema = CreatePostResponseSchema;

export type RepostPostResponse = z.infer<typeof RepostPostResponseSchema>;
