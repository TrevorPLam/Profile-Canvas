import { Router, type Request, type Response } from 'express';
import { postService } from '../services/postService';
import { requireAuth } from '../middlewares/auth';
import {
  CreatePostBody,
  CreatePostResponse,
  ListPostsResponse,
  GetPostResponse,
  RepostPostResponse,
} from '@workspace/api-zod';

const router = Router();

/**
 * POST /posts
 * 
 * Given an authenticated user, when they create a text post,
 * then the post is persisted with inferred topics and returned.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const input = CreatePostBody.parse(req.body);

    let post;
    
    if (input.kind === 'text') {
      post = await postService.createTextPost({
        authorId: userId,
        content: input,
      });
    } else if (input.kind === 'video') {
      post = await postService.createVideoPost({
        authorId: userId,
        content: input,
      });
    } else if (input.kind === 'reel') {
      post = await postService.createReelPost({
        authorId: userId,
        content: input,
      });
    } else {
      res.status(400).json({ message: 'Invalid post kind' });
      return;
    }

    const response = CreatePostResponse.parse(post);
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Failed to create post' });
    }
  }
});

/**
 * GET /posts
 * 
 * Given a request, when it includes optional authorId filter and pagination,
 * then matching posts are returned ordered by creation date (newest first).
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { authorId, limit, offset } = req.query;

    let posts;
    
    if (authorId && typeof authorId === 'string') {
      posts = await postService.listPostsByAuthor(
        authorId,
        limit ? parseInt(limit as string, 10) : 20,
        offset ? parseInt(offset as string, 10) : 0
      );
    } else {
      posts = await postService.listPosts(
        limit ? parseInt(limit as string, 10) : 20,
        offset ? parseInt(offset as string, 10) : 0
      );
    }

    const response = ListPostsResponse.parse({ posts });
    res.json(response);
  } catch (error) {
    console.error('Error listing posts:', error);
    res.status(500).json({ message: 'Failed to list posts' });
  }
});

/**
 * GET /posts/:postId
 * 
 * Given a post ID, when requested, then the post details are returned.
 */
router.get('/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;

    const post = await postService.getPost(postIdStr);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const response = GetPostResponse.parse(post);
    res.json(response);
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ message: 'Failed to get post' });
  }
});

/**
 * DELETE /posts/:postId
 * 
 * Given an authenticated user, when they delete their own post,
 * then the post is soft-deleted.
 */
router.delete('/:postId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;

    await postService.deletePost({
      userId,
      postId: postIdStr,
    });

    // DeletePostResponse is void, return 204 with no body
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      res.status(404).json({ message: 'Post not found' });
    } else if (error instanceof Error && error.message === 'Not authorized to delete this post') {
      res.status(403).json({ message: 'Not authorized to delete this post' });
    } else {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Failed to delete post' });
    }
  }
});

/**
 * POST /posts/:postId/repost
 * 
 * Given an authenticated user, when they repost an existing post,
 * then a new post with repostOf pointing to the ultimate original is created.
 * Duplicate reposts by the same user for the same original are rejected.
 */
router.post('/:postId/repost', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;

    const repost = await postService.createRepost({
      authorId: userId,
      originalPostId: postIdStr,
    });

    const response = RepostPostResponse.parse(repost);
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Original post not found') {
      res.status(404).json({ message: 'Original post not found' });
    } else if (error instanceof Error && error.message === 'Already reposted this post') {
      res.status(409).json({ message: 'Already reposted this post' });
    } else {
      console.error('Error creating repost:', error);
      res.status(500).json({ message: 'Failed to create repost' });
    }
  }
});

export default router;
