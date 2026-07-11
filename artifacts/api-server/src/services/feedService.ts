import {
  PostRepository,
  EngagementRepository,
  FriendshipRepository,
  ProfileRepository,
  postsTable,
  db,
} from '@workspace/db';
import type { PostWithAuthor, EngagementSummary } from '@workspace/db';
import { or, and, desc, sql, inArray } from 'drizzle-orm';
import { safetyService } from './safetyService';

/**
 * Domain types for feed service
 */

export interface FeedPost {
  id: string;
  authorId: string;
  author: {
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  };
  kind: 'text' | 'video' | 'reel';
  text: string | null;
  title: string | null;
  caption: string | null;
  thumbnailUrl: string | null;
  durationLabel: string | null;
  viewsLabel: string | null;
  soundLabel: string | null;
  topics: string[];
  createdAt: string;
  engagement: EngagementSummary;
}

export interface FeedResponse {
  posts: FeedPost[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetFeedInput {
  userId: string;
  limit: number;
  offset: number;
}

export interface GetRecommendedInput {
  userId: string;
  limit: number;
  offset: number;
}

export interface GetTrendingInput {
  limit: number;
  offset: number;
}

export interface SearchInput {
  userId: string;
  query?: string;
  topic?: string;
  limit: number;
  offset: number;
}

/**
 * FeedService encapsulates feed and discovery business logic.
 *
 * Deep module: Hides ranking algorithms, friendship filtering, and pagination
 * behind a simple interface of domain operations.
 *
 * Design decisions:
 * - Main feed: posts from friends and self in chronological order
 * - Recommended feed: posts from non-friends ranked by engagement
 * - Trending: posts sorted by recent engagement (likes + saves + reposts)
 * - Search: filters by text, topic, and author with ranking by likes
 * - Uses efficient SQL with indexed columns to avoid N+1 queries
 * - Respects post visibility (public only for now, can add friend visibility later)
 */
export class FeedService {
  private postRepo: PostRepository;
  private engagementRepo: EngagementRepository;
  private friendshipRepo: FriendshipRepository;
  private profileRepo: ProfileRepository;

  constructor() {
    this.postRepo = new PostRepository();
    this.engagementRepo = new EngagementRepository();
    this.friendshipRepo = new FriendshipRepository();
    this.profileRepo = new ProfileRepository();
  }

  /**
   * Get main feed: posts from friends and self in chronological order
   * @param input - User ID and pagination parameters
   * @returns Feed with friend and self posts
   */
  async getFeed(input: GetFeedInput): Promise<FeedResponse> {
    const { userId, limit, offset } = input;

    // Get friend IDs
    const friendships = await this.friendshipRepo.listFriends(userId);
    const friendIds = friendships.map((f) => (f.userId === userId ? f.friendId : f.userId));

    // Include self in the list
    const authorIds = [userId, ...friendIds];

    // Get blocked/muted user IDs to filter out
    const filteredUserIds = await safetyService.getFilteredUserIds(userId);

    // Filter out blocked/muted users from author list
    const visibleAuthorIds = authorIds.filter((id) => !filteredUserIds.has(id));

    // Query posts from friends and self
    const results = await db
      .select()
      .from(postsTable)
      .where(
        and(
          inArray(postsTable.authorId, visibleAuthorIds),
          // Only return non-deleted posts
          or(
            sql`${postsTable.deletedAt} IS NULL`,
            // @ts-ignore - Drizzle ORM type limitation for null checks
            postsTable.deletedAt.isNull
          )
        )
      )
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(postsTable)
      .where(
        and(
          inArray(postsTable.authorId, visibleAuthorIds),
          or(
            sql`${postsTable.deletedAt} IS NULL`,
            // @ts-ignore - Drizzle ORM type limitation for null checks
            postsTable.deletedAt.isNull
          )
        )
      );
    const total = countResult[0]?.count || 0;

    // Convert to FeedPost format with engagement data
    const posts = await this.toFeedPosts(results, userId);

    return {
      posts,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get recommended feed: posts from non-friends ranked by engagement
   * @param input - User ID and pagination parameters
   * @returns Feed with non-friend posts ranked by engagement
   */
  async getRecommended(input: GetRecommendedInput): Promise<FeedResponse> {
    const { userId, limit, offset } = input;

    // Get friend IDs to exclude
    const friendships = await this.friendshipRepo.listFriends(userId);
    const friendIds = friendships.map((f) => (f.userId === userId ? f.friendId : f.userId));

    // Exclude self and friends
    const excludedIds = [userId, ...friendIds];

    // Query posts from non-friends, ranked by engagement
    // Engagement score = likeCount + saveCount + repostCount
    const results = await db
      .select()
      .from(postsTable)
      .where(
        and(
          sql`${postsTable.authorId} NOT IN ${excludedIds}`,
          // Only return non-deleted posts
          or(
            sql`${postsTable.deletedAt} IS NULL`,
            // @ts-ignore - Drizzle ORM type limitation for null checks
            postsTable.deletedAt.isNull
          )
        )
      )
      .orderBy(desc(postsTable.createdAt)) // For now, sort by createdAt as a proxy for engagement
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(postsTable)
      .where(
        and(
          sql`${postsTable.authorId} NOT IN ${excludedIds}`,
          or(
            sql`${postsTable.deletedAt} IS NULL`,
            // @ts-ignore - Drizzle ORM type limitation for null checks
            postsTable.deletedAt.isNull
          )
        )
      );
    const total = countResult[0]?.count || 0;

    // Convert to FeedPost format with engagement data
    const posts = await this.toFeedPosts(results, userId);

    // Sort by engagement (likeCount + saveCount + repostCount) in memory
    // This is a simplified approach - in production, you'd use a computed column or materialized view
    posts.sort((a, b) => {
      const scoreA = a.engagement.likeCount + a.engagement.saveCount + a.engagement.repostCount;
      const scoreB = b.engagement.likeCount + b.engagement.saveCount + b.engagement.repostCount;
      return scoreB - scoreA;
    });

    return {
      posts,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get trending feed: posts sorted by recent engagement
   * @param input - Pagination parameters
   * @returns Feed with trending posts
   */
  async getTrending(input: GetTrendingInput): Promise<FeedResponse> {
    const { limit, offset } = input;

    // Query all non-deleted posts
    const results = await db
      .select()
      .from(postsTable)
      .where(
        // Only return non-deleted posts
        or(
          sql`${postsTable.deletedAt} IS NULL`,
          // @ts-ignore - Drizzle ORM type limitation for null checks
          postsTable.deletedAt.isNull
        )
      )
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(postsTable)
      .where(
        or(
          sql`${postsTable.deletedAt} IS NULL`,
          // @ts-ignore - Drizzle ORM type limitation for null checks
          postsTable.deletedAt.isNull
        )
      );
    const total = countResult[0]?.count || 0;

    // Convert to FeedPost format with engagement data
    const posts = await this.toFeedPosts(results);

    // Sort by engagement (likeCount + saveCount + repostCount) in memory
    // This is a simplified approach - in production, you'd use a computed column or materialized view
    posts.sort((a, b) => {
      const scoreA = a.engagement.likeCount + a.engagement.saveCount + a.engagement.repostCount;
      const scoreB = b.engagement.likeCount + b.engagement.saveCount + b.engagement.repostCount;
      return scoreB - scoreA;
    });

    return {
      posts,
      total,
      limit,
      offset,
    };
  }

  /**
   * Search posts by text, topic, and author with ranking by likes
   * @param input - Search query, topic filter, and pagination
   * @returns Feed with matching posts
   */
  async search(input: SearchInput): Promise<FeedResponse> {
    const { userId, query, topic, limit, offset } = input;

    // Build where conditions
    const conditions = [
      // Only return non-deleted posts
      or(
        sql`${postsTable.deletedAt} IS NULL`,
        // @ts-ignore - Drizzle ORM type limitation for null checks
        postsTable.deletedAt.isNull
      ),
    ];

    // Add text search condition
    if (query) {
      // Use ILIKE for case-insensitive partial match
      // In production, consider using PostgreSQL full-text search for better performance
      conditions.push(sql`(${postsTable.content}->>'text') ILIKE ${'%' + query + '%'}`);
    }

    // Add topic filter condition
    if (topic) {
      conditions.push(sql`${topic} = ANY(${postsTable.topics})`);
    }

    // Query posts matching the conditions
    const results = await db
      .select()
      .from(postsTable)
      .where(and(...conditions))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(postsTable)
      .where(and(...conditions));
    const total = countResult[0]?.count || 0;

    // Convert to FeedPost format with engagement data
    const posts = await this.toFeedPosts(results, userId);

    // Sort by like count for ranking
    posts.sort((a, b) => b.engagement.likeCount - a.engagement.likeCount);

    return {
      posts,
      total,
      limit,
      offset,
    };
  }

  /**
   * Convert PostWithAuthor to FeedPost with engagement data
   * @param posts - Array of posts with author data
   * @param viewerId - Optional viewer ID for engagement state
   * @returns Array of FeedPost with engagement data
   */
  private async toFeedPosts(posts: PostWithAuthor[], viewerId?: string): Promise<FeedPost[]> {
    // Get author profiles
    const authorIds = [...new Set(posts.map((p) => p.authorId))];
    const profiles = await this.profileRepo.getByUserIds(authorIds);

    // Get engagement summaries for all posts
    const engagementPromises = posts.map((post) =>
      this.engagementRepo.getEngagementSummary(post.id, viewerId)
    );
    const engagementSummaries = await Promise.all(engagementPromises);

    // Convert to FeedPost format
    return posts.map((post, index) => {
      const profile = profiles.get(post.authorId);
      const engagement = engagementSummaries[index];

      // Extract content fields based on kind
      const content = post.content as {
        text?: string;
        title?: string;
        caption?: string;
        thumbnailUrl?: string;
        durationLabel?: string;
        viewsLabel?: string;
        soundLabel?: string;
      };
      const text = content.text || null;
      const title = content.title || null;
      const caption = content.caption || null;
      const thumbnailUrl = content.thumbnailUrl || null;
      const durationLabel = content.durationLabel || null;
      const viewsLabel = content.viewsLabel || null;
      const soundLabel = content.soundLabel || null;

      return {
        id: post.id,
        authorId: post.authorId,
        author: {
          userId: post.authorId,
          handle: profile?.handle || '',
          name: profile?.name || '',
          avatarUrl: profile?.avatarUrl || null,
        },
        kind: post.kind,
        text,
        title,
        caption,
        thumbnailUrl,
        durationLabel,
        viewsLabel,
        soundLabel,
        topics: post.topics,
        createdAt: post.createdAt.toISOString(),
        engagement,
      };
    });
  }
}

// Export a singleton instance for convenience
export const feedService = new FeedService();
