import { pollRepository, streakRepository, badgeRepository } from '@workspace/db';
import type { Poll, PollOption, PollVote } from '@workspace/db';
import type { Streak } from '@workspace/db';
import type { BadgeCriteria } from '@workspace/db';

/**
 * Domain types for gamification service
 */

export interface CreatePollInput {
  postId: string;
  question: string;
  options: Omit<PollOption, 'voteCount'>[];
  expiresAt?: string;
}

export interface PollResponse {
  id: string;
  postId: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
  userVote?: PollVote;
  expiresAt?: string;
  createdAt: string;
}

export interface VotePollInput {
  pollId: string;
  userId: string;
  optionId: string;
}

export interface CreateQuizInput {
  postId: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // Index of correct option
}

export interface QuizResponse {
  id: string;
  postId: string;
  questions: QuizQuestion[];
  totalSubmissions: number;
  userScore?: number;
  userSubmitted?: boolean;
  createdAt: string;
}

export interface SubmitQuizInput {
  quizId: string;
  userId: string;
  answers: number[];
}

export interface StreakResponse {
  id: string;
  userId: string;
  streakType: string;
  currentCount: number;
  longestCount: number;
  lastActivityAt?: string;
  nextResetAt?: string;
  frozenDays: number;
  createdAt: string;
}

export interface StreakListResponse {
  streaks: StreakResponse[];
  total: number;
}

export interface RecordStreakInput {
  userId: string;
  streakType: string;
  timestamp?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  awardedAt: string;
}

export interface BadgeListResponse {
  badges: Badge[];
  total: number;
}

export interface AvailableBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
  earned: boolean;
}

export interface AvailableBadgeListResponse {
  badges: AvailableBadge[];
  total: number;
}

/**
 * GamificationService encapsulates gamification business logic.
 *
 * Deep module: Hides badge logic, streak calculation, and poll/quiz validation
 * behind a simple interface of domain operations.
 *
 * Design decisions:
 * - Polls are one-vote-per-user (idempotent)
 * - Quizzes are one-submission-per-user
 * - Streaks reset after inactivity (configurable period)
 * - Badges are auto-awarded based on criteria
 * - Anonymous voting/answering by default
 */
export class GamificationService {
  /**
   * Create a poll attached to a post
   * @param input - The poll creation data
   * @returns The created poll
   */
  async createPoll(input: CreatePollInput): Promise<PollResponse> {
    // Validate options (2-10 options)
    if (input.options.length < 2 || input.options.length > 10) {
      throw new Error('Poll must have between 2 and 10 options');
    }

    // Initialize options with vote counts
    const options: PollOption[] = input.options.map((opt) => ({
      ...opt,
      voteCount: 0,
    }));

    const poll = await pollRepository.create({
      postId: input.postId,
      question: input.question,
      options,
      votes: [],
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    });

    return this.toPollResponse(poll, false);
  }

  /**
   * Get a poll with results
   * @param pollId - The poll's UUID
   * @param userId - The user's UUID (optional, for checking if voted)
   * @returns The poll with results
   */
  async getPoll(pollId: string, userId?: string): Promise<PollResponse | null> {
    const poll = await pollRepository.getById(pollId);
    if (!poll) {
      return null;
    }

    // Check if expired
    const isExpired = await pollRepository.isExpired(pollId);
    if (isExpired) {
      // Still return poll, but voting is disabled
    }

    const hasVoted = userId ? await pollRepository.hasUserVoted(pollId, userId) : false;
    const userVote = userId && hasVoted ? (await pollRepository.getUserVote(pollId, userId)) || undefined : undefined;

    return this.toPollResponse(poll, hasVoted, userVote);
  }

  /**
   * Vote on a poll (idempotent)
   * @param input - The vote data
   * @returns The updated poll
   */
  async votePoll(input: VotePollInput): Promise<PollResponse> {
    const poll = await pollRepository.getById(input.pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    // Check if expired
    const isExpired = await pollRepository.isExpired(input.pollId);
    if (isExpired) {
      throw new Error('Poll has expired');
    }

    // Check if already voted
    const hasVoted = await pollRepository.hasUserVoted(input.pollId, input.userId);
    if (hasVoted) {
      // Idempotent: return current state
      const userVote = (await pollRepository.getUserVote(input.pollId, input.userId)) || undefined;
      return this.toPollResponse(poll, true, userVote);
    }

    // Validate option exists
    const optionExists = poll.options.some((opt) => opt.id === input.optionId);
    if (!optionExists) {
      throw new Error('Invalid option');
    }

    // Add vote
    const newVote: PollVote = {
      userId: input.userId,
      optionId: input.optionId,
      votedAt: new Date().toISOString(),
    };

    // Update option vote count
    const updatedOptions = poll.options.map((opt) =>
      opt.id === input.optionId ? { ...opt, voteCount: opt.voteCount + 1 } : opt
    );

    const updatedPoll = await pollRepository.update(input.pollId, {
      votes: [...poll.votes, newVote],
      options: updatedOptions,
    });

    if (!updatedPoll) {
      throw new Error('Failed to update poll');
    }

    return this.toPollResponse(updatedPoll, true, newVote);
  }

  /**
   * Create a quiz attached to a post
   * @param input - The quiz creation data
   * @returns The created quiz (stored as poll for simplicity)
   */
  async createQuiz(input: CreateQuizInput): Promise<QuizResponse> {
    // For simplicity, quizzes are stored as polls with special structure
    // In a full implementation, we'd have a separate quizzes table
    const poll = await pollRepository.create({
      postId: input.postId,
      question: 'QUIZ', // Marker for quiz
      options: input.questions.map((q) => ({
        id: q.id,
        text: JSON.stringify(q),
        voteCount: 0, // Used for submission count
      })),
      votes: [], // Stores submissions
      expiresAt: undefined,
    });

    return this.toQuizResponse(poll);
  }

  /**
   * Get a quiz with results
   * @param quizId - The quiz's UUID
   * @param userId - The user's UUID (optional)
   * @returns The quiz with results
   */
  async getQuiz(quizId: string, userId?: string): Promise<QuizResponse | null> {
    const poll = await pollRepository.getById(quizId);
    if (!poll || poll.question !== 'QUIZ') {
      return null;
    }

    return this.toQuizResponse(poll, userId);
  }

  /**
   * Submit quiz answers
   * @param input - The submission data
   * @returns The quiz with score
   */
  async submitQuiz(input: SubmitQuizInput): Promise<QuizResponse> {
    const poll = await pollRepository.getById(input.quizId);
    if (!poll || poll.question !== 'QUIZ') {
      throw new Error('Quiz not found');
    }

    // Check if already submitted
    const hasSubmitted = await pollRepository.hasUserVoted(input.quizId, input.userId);
    if (hasSubmitted) {
      // Return current state
      return this.toQuizResponse(poll, input.userId);
    }

    // Calculate score
    const questions = poll.options.map((opt) => JSON.parse(opt.text) as QuizQuestion);
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (input.answers[i] === questions[i].correctAnswer) {
        score++;
      }
    }

    // Store submission
    const submission: PollVote = {
      userId: input.userId,
      optionId: JSON.stringify({ answers: input.answers, score }),
      votedAt: new Date().toISOString(),
    };

    // Update submission count
    const updatedOptions = poll.options.map((opt) => ({
      ...opt,
      voteCount: opt.voteCount + 1,
    }));

    const updatedPoll = await pollRepository.update(input.quizId, {
      votes: [...poll.votes, submission],
      options: updatedOptions,
    });

    if (!updatedPoll) {
      throw new Error('Failed to update quiz');
    }

    return this.toQuizResponse(updatedPoll, input.userId);
  }

  /**
   * Get all streaks for a user
   * @param userId - The user's UUID
   * @returns List of streaks
   */
  async getStreaks(userId: string): Promise<StreakListResponse> {
    const streaks = await streakRepository.listByUser(userId);

    return {
      streaks: streaks.map((s) => this.toStreakResponse(s)),
      total: streaks.length,
    };
  }

  /**
   * Record streak activity
   * @param input - The streak activity data
   * @returns The updated streak
   */
  async recordStreakActivity(input: RecordStreakInput): Promise<StreakResponse> {
    const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();

    // Get or create streak
    let streak = await streakRepository.getByUserAndType(input.userId, input.streakType);
    if (!streak) {
      streak = await streakRepository.create({
        userId: input.userId,
        streakType: input.streakType,
        currentCount: 0,
        longestCount: 0,
        lastActivityAt: timestamp,
        nextResetAt: this.calculateNextReset(timestamp),
        frozenDays: 0,
      });
    }

    // Check if streak expired
    if (streak.nextResetAt && new Date(streak.nextResetAt) < timestamp) {
      // Streak expired, reset count
      streak = await streakRepository.update(streak.id, {
        currentCount: 0,
        lastActivityAt: timestamp,
        nextResetAt: this.calculateNextReset(timestamp),
      });
      if (!streak) {
        throw new Error('Failed to reset streak');
      }
    }

    // Check if already recorded today
    if (streak.lastActivityAt) {
      const lastDate = new Date(streak.lastActivityAt).toDateString();
      const currentDate = timestamp.toDateString();
      if (lastDate === currentDate) {
        // Already recorded today, return current state
        return this.toStreakResponse(streak);
      }
    }

    // Increment streak
    const newCount = streak.currentCount + 1;
    const newLongest = Math.max(streak.longestCount, newCount);

    const updatedStreak = await streakRepository.update(streak.id, {
      currentCount: newCount,
      longestCount: newLongest,
      lastActivityAt: timestamp,
      nextResetAt: this.calculateNextReset(timestamp),
    });

    if (!updatedStreak) {
      throw new Error('Failed to update streak');
    }

    // Check for badge award
    await this.checkAndAwardBadge(input.userId, 'streak_count', newLongest);

    return this.toStreakResponse(updatedStreak);
  }

  /**
   * Get all badges for a user
   * @param userId - The user's UUID
   * @returns List of earned badges
   */
  async getBadges(userId: string): Promise<BadgeListResponse> {
    const badges = await badgeRepository.listByUser(userId);

    return {
      badges: badges.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        awardedAt: b.awardedAt.toISOString(),
      })),
      total: badges.length,
    };
  }

  /**
   * Get available badges with earned status
   * @param userId - The user's UUID
   * @returns List of available badges
   */
  async getAvailableBadges(userId: string): Promise<AvailableBadgeListResponse> {
    // Define available badges (in production, this would be in a separate table)
    const availableBadges: AvailableBadge[] = [
      {
        id: 'streak_3',
        name: '3-Day Streak',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        criteria: { type: 'streak_count', value: 3, description: '3-day streak' },
        earned: await badgeRepository.hasBadge(userId, 'streak_3'),
      },
      {
        id: 'streak_7',
        name: '7-Day Streak',
        description: 'Maintain a 7-day streak',
        icon: '🔥🔥',
        criteria: { type: 'streak_count', value: 7, description: '7-day streak' },
        earned: await badgeRepository.hasBadge(userId, 'streak_7'),
      },
      {
        id: 'streak_30',
        name: '30-Day Streak',
        description: 'Maintain a 30-day streak',
        icon: '🔥🔥🔥',
        criteria: { type: 'streak_count', value: 30, description: '30-day streak' },
        earned: await badgeRepository.hasBadge(userId, 'streak_30'),
      },
      {
        id: 'first_post',
        name: 'First Post',
        description: 'Create your first post',
        icon: '✨',
        criteria: { type: 'post_count', value: 1, description: '1 post' },
        earned: await badgeRepository.hasBadge(userId, 'first_post'),
      },
      {
        id: 'post_10',
        name: '10 Posts',
        description: 'Create 10 posts',
        icon: '📝',
        criteria: { type: 'post_count', value: 10, description: '10 posts' },
        earned: await badgeRepository.hasBadge(userId, 'post_10'),
      },
    ];

    return {
      badges: availableBadges,
      total: availableBadges.length,
    };
  }

  /**
   * Check and award a badge based on criteria
   * @param userId - The user's UUID
   * @param criteriaType - The criteria type
   * @param value - The criteria value
   */
  private async checkAndAwardBadge(userId: string, criteriaType: string, value: number): Promise<void> {
    const availableBadges = await this.getAvailableBadges(userId);
    const matchingBadge = availableBadges.badges.find(
      (b) => b.criteria.type === criteriaType && b.criteria.value === value && !b.earned
    );

    if (matchingBadge) {
      await badgeRepository.create({
        userId,
        badgeId: matchingBadge.id,
        name: matchingBadge.name,
        description: matchingBadge.description,
        icon: matchingBadge.icon,
        criteria: matchingBadge.criteria,
      });
    }
  }

  /**
   * Calculate next reset time (24 hours from now)
   */
  private calculateNextReset(from: Date): Date {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  /**
   * Convert a poll to a response
   */
  private toPollResponse(poll: Poll, hasVoted: boolean, userVote?: PollVote): PollResponse {
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

    return {
      id: poll.id,
      postId: poll.postId,
      question: poll.question,
      options: poll.options,
      totalVotes,
      hasVoted,
      userVote,
      expiresAt: poll.expiresAt?.toISOString(),
      createdAt: poll.createdAt.toISOString(),
    };
  }

  /**
   * Convert a poll to a quiz response
   */
  private toQuizResponse(poll: Poll, userId?: string): QuizResponse {
    const questions = poll.options.map((opt) => JSON.parse(opt.text) as QuizQuestion);
    const totalSubmissions = poll.votes.length;

    let userScore: number | undefined;
    let userSubmitted = false;

    if (userId) {
      const userSubmission = poll.votes.find((v) => v.userId === userId);
      if (userSubmission) {
        userSubmitted = true;
        const submissionData = JSON.parse(userSubmission.optionId);
        userScore = submissionData.score;
      }
    }

    return {
      id: poll.id,
      postId: poll.postId,
      questions,
      totalSubmissions,
      userScore,
      userSubmitted,
      createdAt: poll.createdAt.toISOString(),
    };
  }

  /**
   * Convert a streak to a response
   */
  private toStreakResponse(streak: Streak): StreakResponse {
    return {
      id: streak.id,
      userId: streak.userId,
      streakType: streak.streakType,
      currentCount: streak.currentCount,
      longestCount: streak.longestCount,
      lastActivityAt: streak.lastActivityAt?.toISOString(),
      nextResetAt: streak.nextResetAt?.toISOString(),
      frozenDays: streak.frozenDays,
      createdAt: streak.createdAt.toISOString(),
    };
  }
}

// Export a singleton instance for convenience
export const gamificationService = new GamificationService();
