import { Router, type Request, type Response } from 'express';
import { storyService } from '../services/storyService';
import { requireAuth } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Zod schemas for request validation (temporary until codegen is fixed)
const CreateStoryRequestSchema = z.object({
  mediaUrl: z.string(),
  mediaType: z.enum(['image', 'video']),
  stickers: z.array(z.any()).optional(),
  poll: z.any().optional(),
  audience: z.enum(['everyone', 'friends', 'custom']),
  audienceListId: z.string().nullable().optional(),
});

/**
 * POST /stories
 *
 * Given an authenticated user, when they create a story,
 * then the story is stored with a 24-hour expiration and optional stickers/polls.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const input = CreateStoryRequestSchema.parse(req.body);

    const story = await storyService.createStory({
      authorId: userId,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      stickers: input.stickers,
      poll: input.poll,
      audience: input.audience,
      audienceListId: input.audienceListId || undefined,
    });

    res.status(201).json({ story });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ message: 'Invalid request' });
    } else if (error instanceof Error && error.message === 'audienceListId is required when audience is custom') {
      res.status(400).json({ message: 'audienceListId is required when audience is custom' });
    } else {
      console.error('Error creating story:', error);
      res.status(500).json({ message: 'Failed to create story' });
    }
  }
});

/**
 * GET /stories/feed
 *
 * Given an authenticated user, when they request the stories feed,
 * then non-expired stories from people they follow are returned grouped by author.
 */
router.get('/feed', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const stories = await storyService.getStoriesFeed({ viewerId: userId });

    // Group stories by author
    const grouped = new Map<string, typeof stories>();
    for (const story of stories) {
      if (!grouped.has(story.authorId)) {
        grouped.set(story.authorId, []);
      }
      grouped.get(story.authorId)!.push(story);
    }

    // Convert to array of groups
    const groups = Array.from(grouped.entries()).map(([authorId, authorStories]) => ({
      authorId,
      stories: authorStories,
    }));

    res.json({ groups, total: groups.length });
  } catch (error) {
    console.error('Error getting stories feed:', error);
    res.status(500).json({ message: 'Failed to get stories feed' });
  }
});

/**
 * GET /stories/:userId
 *
 * Given a user ID, when their stories are requested,
 * then non-expired stories are returned if the viewer is in the audience.
 */
router.get('/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const viewerId = req.userId!;
    const { userId } = req.params;
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;

    const stories = await storyService.getUserStories({
      viewerId,
      targetUserId: userIdStr,
    });

    if (stories.length === 0) {
      res.status(404).json({ message: 'User not found or no stories available' });
      return;
    }

    res.json({ stories });
  } catch (error) {
    console.error('Error getting user stories:', error);
    res.status(500).json({ message: 'Failed to get user stories' });
  }
});

/**
 * DELETE /stories/:id
 *
 * Given an authenticated user and their story, when they delete it,
 * then the story is removed immediately.
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;

    await storyService.deleteStory({
      userId,
      storyId: idStr,
    });

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Story not found') {
      res.status(404).json({ message: 'Story not found' });
    } else if (error instanceof Error && error.message === 'Not authorized to delete this story') {
      res.status(403).json({ message: 'Not authorized to delete this story' });
    } else {
      console.error('Error deleting story:', error);
      res.status(500).json({ message: 'Failed to delete story' });
    }
  }
});

export default router;
