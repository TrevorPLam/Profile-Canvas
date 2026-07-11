import { storyRepository } from '@workspace/db';

/**
 * Cleanup expired stories job
 *
 * This job deletes stories that have expired (expiresAt < now).
 * It should be run periodically (e.g., daily) via a cron job or scheduled task.
 *
 * Usage:
 *   node -e "require('./src/jobs/cleanupStories').cleanupExpiredStories()"
 */
export async function cleanupExpiredStories(): Promise<void> {
  try {
    const deletedCount = await storyRepository.deleteExpired();
    console.log(`Cleanup completed: Deleted ${deletedCount} expired stories`);
  } catch (error) {
    console.error('Error cleaning up expired stories:', error);
    throw error;
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupExpiredStories()
    .then(() => {
      console.log('Story cleanup job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Story cleanup job failed:', error);
      process.exit(1);
    });
}
