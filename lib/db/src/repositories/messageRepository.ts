import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { db } from '../index';
import {
  conversationsTable,
  conversationParticipantsTable,
  messagesTable,
  type MessageReaction,
  type MessageReadReceipt,
} from '../schema';
import { profilesTable } from '../schema/profiles';

/**
 * Domain types for message repository
 * These hide the underlying Drizzle table structure from callers
 */

export interface ConversationCreateInput {
  name: string | null;
  isGroup: boolean;
  participantIds: string[];
}

export interface ConversationWithParticipants {
  id: string;
  name: string | null;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  }[];
}

export interface ConversationWithLastMessage extends ConversationWithParticipants {
  lastMessage: {
    id: string;
    content: string;
    type: string;
    authorId: string;
    createdAt: Date;
  } | null;
  unreadCount: number;
}

export interface MessageCreateInput {
  conversationId: string;
  authorId: string;
  type: string;
  content: string;
  mediaId?: string;
  replyToMessageId?: string;
}

export interface MessageWithAuthor {
  id: string;
  conversationId: string;
  authorId: string;
  type: string;
  content: string;
  mediaId: string | null;
  replyToMessageId: string | null;
  reactions: MessageReaction[];
  readReceipts: MessageReadReceipt[];
  createdAt: Date;
  updatedAt: Date;
  author: {
    userId: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
  };
}

/**
 * MessageRepository encapsulates all messaging data access logic.
 *
 * Deep module: Hides Drizzle internals, participant joins, message threading,
 * read receipts, and reactions behind a simple interface of domain operations.
 */
export class MessageRepository {
  /**
   * Create a new conversation with participants
   * @param input - Conversation creation data with participant IDs
   * @returns The created conversation with participants
   */
  async createConversation(input: ConversationCreateInput): Promise<ConversationWithParticipants> {
    // Create the conversation
    const conversationResult = await db
      .insert(conversationsTable)
      .values({
        name: input.name,
        isGroup: input.isGroup,
      })
      .returning();

    const conversation = conversationResult[0];

    // Add all participants (including the creator if not in the list)
    const allParticipantIds = [...new Set(input.participantIds)];

    await db.insert(conversationParticipantsTable).values(
      allParticipantIds.map((userId) => ({
        conversationId: conversation.id,
        userId,
      }))
    );

    const result = await this.getConversationWithParticipants(conversation.id);
    if (!result) {
      throw new Error('Failed to retrieve created conversation');
    }
    return result;
  }

  /**
   * Get a conversation by ID with participants
   * @param conversationId - The conversation's UUID
   * @returns The conversation with participants or null if not found
   */
  async getConversationWithParticipants(
    conversationId: string
  ): Promise<ConversationWithParticipants | null> {
    const conversationResult = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .limit(1);

    if (conversationResult.length === 0) {
      return null;
    }

    const conversation = conversationResult[0];

    // Get participants with profile information
    const participantsResult = await db
      .select({
        userId: conversationParticipantsTable.userId,
        handle: profilesTable.handle,
        name: profilesTable.name,
        avatarUrl: profilesTable.avatarUrl,
      })
      .from(conversationParticipantsTable)
      .innerJoin(profilesTable, eq(conversationParticipantsTable.userId, profilesTable.userId))
      .where(eq(conversationParticipantsTable.conversationId, conversationId));

    return {
      id: conversation.id,
      name: conversation.name,
      isGroup: conversation.isGroup,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: participantsResult,
    };
  }

  /**
   * List conversations for a user with last message preview and unread count
   * @param userId - The user's UUID
   * @param limit - Maximum number of conversations to return
   * @param offset - Number of conversations to skip for pagination
   * @returns Array of conversations with last message and unread count
   */
  async listConversationsForUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ConversationWithLastMessage[]> {
    // Get conversations where the user is a participant
    const userConversations = await db
      .select({ conversationId: conversationParticipantsTable.conversationId })
      .from(conversationParticipantsTable)
      .where(eq(conversationParticipantsTable.userId, userId));

    const conversationIds = userConversations.map((c) => c.conversationId);

    if (conversationIds.length === 0) {
      return [];
    }

    // Get conversations with participants
    const conversations = await db
      .select()
      .from(conversationsTable)
      .where(inArray(conversationsTable.id, conversationIds))
      .orderBy(desc(conversationsTable.updatedAt))
      .limit(limit)
      .offset(offset);

    // For each conversation, get participants, last message, and unread count
    const results: ConversationWithLastMessage[] = [];

    for (const conversation of conversations) {
      const participants = await db
        .select({
          userId: conversationParticipantsTable.userId,
          handle: profilesTable.handle,
          name: profilesTable.name,
          avatarUrl: profilesTable.avatarUrl,
        })
        .from(conversationParticipantsTable)
        .innerJoin(profilesTable, eq(conversationParticipantsTable.userId, profilesTable.userId))
        .where(eq(conversationParticipantsTable.conversationId, conversation.id));

      // Get last message
      const lastMessageResult = await db
        .select({
          id: messagesTable.id,
          content: messagesTable.content,
          type: messagesTable.type,
          authorId: messagesTable.authorId,
          createdAt: messagesTable.createdAt,
        })
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conversation.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      // Count unread messages (messages where user is not in readReceipts)
      const unreadResult = await db
        .select({ id: messagesTable.id })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, conversation.id),
            sql`NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(${messagesTable.readReceipts}) as receipt
              WHERE receipt->>'userId' = ${userId}
            )`
          )
        );

      results.push({
        id: conversation.id,
        name: conversation.name,
        isGroup: conversation.isGroup,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        participants,
        lastMessage: lastMessageResult[0] || null,
        unreadCount: unreadResult.length,
      });
    }

    return results;
  }

  /**
   * Check if a user is a participant in a conversation
   * @param conversationId - The conversation's UUID
   * @param userId - The user's UUID
   * @returns True if the user is a participant
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(conversationParticipantsTable)
      .where(
        and(
          eq(conversationParticipantsTable.conversationId, conversationId),
          eq(conversationParticipantsTable.userId, userId)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Delete a conversation (removes it for all participants)
   * @param conversationId - The conversation's UUID
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await db.delete(conversationsTable).where(eq(conversationsTable.id, conversationId));
  }

  /**
   * Create a new message in a conversation
   * @param input - Message creation data
   * @returns The created message with author information
   */
  async createMessage(input: MessageCreateInput): Promise<MessageWithAuthor> {
    const result = await db
      .insert(messagesTable)
      .values({
        conversationId: input.conversationId,
        authorId: input.authorId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type cast needed for MessageType enum
        type: input.type as any,
        content: input.content,
        mediaId: input.mediaId,
        replyToMessageId: input.replyToMessageId,
      })
      .returning();

    const message = await this.getMessageWithAuthor(result[0].id);

    if (!message) {
      throw new Error('Failed to retrieve created message');
    }

    // Update conversation's updatedAt timestamp
    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, input.conversationId));

    return message;
  }

  /**
   * Get a message by ID with author information
   * @param messageId - The message's UUID
   * @returns The message with author or null if not found
   */
  async getMessageWithAuthor(messageId: string): Promise<MessageWithAuthor | null> {
    const result = await db
      .select({
        id: messagesTable.id,
        conversationId: messagesTable.conversationId,
        authorId: messagesTable.authorId,
        type: messagesTable.type,
        content: messagesTable.content,
        mediaId: messagesTable.mediaId,
        replyToMessageId: messagesTable.replyToMessageId,
        reactions: messagesTable.reactions,
        readReceipts: messagesTable.readReceipts,
        createdAt: messagesTable.createdAt,
        updatedAt: messagesTable.updatedAt,
        author: {
          userId: profilesTable.userId,
          handle: profilesTable.handle,
          name: profilesTable.name,
          avatarUrl: profilesTable.avatarUrl,
        },
      })
      .from(messagesTable)
      .innerJoin(profilesTable, eq(messagesTable.authorId, profilesTable.userId))
      .where(eq(messagesTable.id, messageId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0] as MessageWithAuthor;
  }

  /**
   * List messages in a conversation with author information, ordered chronologically
   * @param conversationId - The conversation's UUID
   * @param limit - Maximum number of messages to return
   * @param offset - Number of messages to skip for pagination
   * @returns Array of messages with author information
   */
  async listMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessageWithAuthor[]> {
    const results = await db
      .select({
        id: messagesTable.id,
        conversationId: messagesTable.conversationId,
        authorId: messagesTable.authorId,
        type: messagesTable.type,
        content: messagesTable.content,
        mediaId: messagesTable.mediaId,
        replyToMessageId: messagesTable.replyToMessageId,
        reactions: messagesTable.reactions,
        readReceipts: messagesTable.readReceipts,
        createdAt: messagesTable.createdAt,
        updatedAt: messagesTable.updatedAt,
        author: {
          userId: profilesTable.userId,
          handle: profilesTable.handle,
          name: profilesTable.name,
          avatarUrl: profilesTable.avatarUrl,
        },
      })
      .from(messagesTable)
      .innerJoin(profilesTable, eq(messagesTable.authorId, profilesTable.userId))
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(desc(messagesTable.createdAt))
      .limit(limit)
      .offset(offset);

    return results as MessageWithAuthor[];
  }

  /**
   * Add a reaction to a message
   * @param messageId - The message's UUID
   * @param userId - The user's UUID
   * @param emoji - The emoji reaction
   */
  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const message = await db
      .select({ reactions: messagesTable.reactions })
      .from(messagesTable)
      .where(eq(messagesTable.id, messageId))
      .limit(1);

    if (message.length === 0) {
      throw new Error('Message not found');
    }

    const reactions = (message[0].reactions as MessageReaction[]) || [];
    const existingReactionIndex = reactions.findIndex((r) => r.userId === userId);

    if (existingReactionIndex >= 0) {
      // Update existing reaction
      reactions[existingReactionIndex] = {
        userId,
        emoji,
        createdAt: new Date().toISOString(),
      };
    } else {
      // Add new reaction
      reactions.push({
        userId,
        emoji,
        createdAt: new Date().toISOString(),
      });
    }

    await db.update(messagesTable).set({ reactions }).where(eq(messagesTable.id, messageId));
  }

  /**
   * Remove a reaction from a message
   * @param messageId - The message's UUID
   * @param userId - The user's UUID
   */
  async removeReaction(messageId: string, userId: string): Promise<void> {
    const message = await db
      .select({ reactions: messagesTable.reactions })
      .from(messagesTable)
      .where(eq(messagesTable.id, messageId))
      .limit(1);

    if (message.length === 0) {
      throw new Error('Message not found');
    }

    const reactions = (message[0].reactions as MessageReaction[]) || [];
    const filteredReactions = reactions.filter((r) => r.userId !== userId);

    await db
      .update(messagesTable)
      .set({ reactions: filteredReactions })
      .where(eq(messagesTable.id, messageId));
  }

  /**
   * Mark a message as read by a user
   * @param messageId - The message's UUID
   * @param userId - The user's UUID
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    const message = await db
      .select({ readReceipts: messagesTable.readReceipts })
      .from(messagesTable)
      .where(eq(messagesTable.id, messageId))
      .limit(1);

    if (message.length === 0) {
      throw new Error('Message not found');
    }

    const readReceipts = (message[0].readReceipts as MessageReadReceipt[]) || [];
    const existingReceiptIndex = readReceipts.findIndex((r) => r.userId === userId);

    if (existingReceiptIndex >= 0) {
      // Update existing receipt
      readReceipts[existingReceiptIndex] = {
        userId,
        readAt: new Date().toISOString(),
      };
    } else {
      // Add new receipt
      readReceipts.push({
        userId,
        readAt: new Date().toISOString(),
      });
    }

    await db.update(messagesTable).set({ readReceipts }).where(eq(messagesTable.id, messageId));
  }
}

// Export a singleton instance for convenience
export const messageRepository = new MessageRepository();
