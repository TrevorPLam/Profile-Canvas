import { z } from 'zod';

/**
 * Author profile schema for comment authors
 * Simplified version of UserProfile to avoid N+1 queries
 */
export const AuthorProfileSchema = z.object({
  userId: z.string(),
  handle: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
});

export type AuthorProfile = z.infer<typeof AuthorProfileSchema>;

/**
 * Comment create request schema
 */
export const CommentCreateRequestSchema = z.object({
  text: z.string(),
});

export type CommentCreateRequest = z.infer<typeof CommentCreateRequestSchema>;

/**
 * Comment response schema
 */
export const CommentResponseSchema = z.object({
  id: z.string(),
  postId: z.string(),
  author: AuthorProfileSchema,
  text: z.string(),
  createdAt: z.string(), // ISO timestamp
});

export type CommentResponse = z.infer<typeof CommentResponseSchema>;

/**
 * Comment list response schema
 */
export const CommentListResponseSchema = z.object({
  comments: z.array(CommentResponseSchema),
  total: z.number(),
});

export type CommentListResponse = z.infer<typeof CommentListResponseSchema>;
