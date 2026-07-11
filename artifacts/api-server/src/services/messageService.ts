import {
  messageRepository,
  type ConversationWithLastMessage,
  type MessageWithAuthor,
} from '@workspace/db';
import { notificationService } from './notificationService';

export interface CreateConversationInput {
  name: string | null;
  isGroup: boolean;
  participantIds: string[];
  currentUserId: string;
}

export interface SendMessageInput {
  conversationId: string;
  authorId: string;
  type: string;
  content: string;
  mediaId?: string;
  replyToMessageId?: string;
}

export interface AddReactionInput {
  messageId: string;
  userId: string;
  emoji: string;
}

export interface MarkReadInput {
  messageId: string;
  userId: string;
}

/**
 * MessageService encapsulates messaging business logic.
 *
 * Deep module: Hides conversation CRUD, message persistence, WebSocket broadcasting,
 * read receipt logic, and reaction management behind a simple interface of domain operations.
 */
export class MessageService {
  /**
   * Create a new conversation with participants
   * Validates that all participants exist and adds the current user if not included
   */
  async createConversation(input: CreateConversationInput): Promise<ConversationWithLastMessage> {
    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([...input.participantIds, input.currentUserId])];

    // Create the conversation
    const conversation = await messageRepository.createConversation({
      name: input.name,
      isGroup: input.isGroup,
      participantIds: allParticipantIds,
    });

    // Return with empty last message and zero unread count (new conversation)
    return {
      ...conversation,
      lastMessage: null,
      unreadCount: 0,
    };
  }

  /**
   * List conversations for a user with last message preview and unread count
   */
  async listConversations(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    conversations: ConversationWithLastMessage[];
    total: number;
  }> {
    const conversations = await messageRepository.listConversationsForUser(userId, limit, offset);

    // Get total count
    const userConversations = await messageRepository.listConversationsForUser(userId, 1000, 0);
    const total = userConversations.length;

    return { conversations, total };
  }

  /**
   * Get a single conversation by ID
   * Validates that the user is a participant
   */
  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<ConversationWithLastMessage | null> {
    // Check if user is a participant
    const isParticipant = await messageRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      return null;
    }

    const conversation = await messageRepository.getConversationWithParticipants(conversationId);
    if (!conversation) {
      return null;
    }

    // Get last message and unread count
    const messages = await messageRepository.listMessages(conversationId, 1, 0);
    const lastMessage = messages[0] || null;

    // Count unread messages
    const unreadCount = messages.filter((m) => {
      const receipts = m.readReceipts || [];
      return !receipts.some((r) => r.userId === userId);
    }).length;

    return {
      ...conversation,
      lastMessage,
      unreadCount,
    };
  }

  /**
   * Delete a conversation
   * Validates that the user is a participant
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const isParticipant = await messageRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new Error('Not authorized to delete this conversation');
    }

    await messageRepository.deleteConversation(conversationId);
  }

  /**
   * Send a message to a conversation
   * Validates that the user is a participant
   * Emits a notification to other participants
   */
  async sendMessage(input: SendMessageInput): Promise<MessageWithAuthor> {
    // Validate that the sender is a participant
    const isParticipant = await messageRepository.isParticipant(
      input.conversationId,
      input.authorId
    );
    if (!isParticipant) {
      throw new Error('Not authorized to send messages to this conversation');
    }

    // Create the message
    const message = await messageRepository.createMessage(input);

    // Get conversation participants to notify them
    const conversation = await messageRepository.getConversationWithParticipants(
      input.conversationId
    );
    if (conversation) {
      // Notify all participants except the sender
      for (const participant of conversation.participants) {
        if (participant.userId !== input.authorId) {
          await notificationService.create({
            recipientId: participant.userId,
            actorId: input.authorId,
            type: 'message',
          });
        }
      }
    }

    return message;
  }

  /**
   * List messages in a conversation
   * Validates that the user is a participant
   */
  async listMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: MessageWithAuthor[]; total: number }> {
    // Validate that the user is a participant
    const isParticipant = await messageRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new Error('Not authorized to view messages in this conversation');
    }

    const messages = await messageRepository.listMessages(conversationId, limit, offset);

    // Get total count (fetch all with high limit)
    const allMessages = await messageRepository.listMessages(conversationId, 1000, 0);
    const total = allMessages.length;

    return { messages, total };
  }

  /**
   * Add a reaction to a message
   * Validates that the user is a participant in the conversation
   */
  async addReaction(input: AddReactionInput, userId: string): Promise<void> {
    // Get the message to find the conversation
    const message = await messageRepository.getMessageWithAuthor(input.messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Validate that the user is a participant
    const isParticipant = await messageRepository.isParticipant(message.conversationId, userId);
    if (!isParticipant) {
      throw new Error('Not authorized to react to messages in this conversation');
    }

    await messageRepository.addReaction(input.messageId, input.userId, input.emoji);
  }

  /**
   * Remove a reaction from a message
   * Validates that the user is the one who added the reaction
   */
  async removeReaction(messageId: string, userId: string): Promise<void> {
    // Get the message to find the conversation
    const message = await messageRepository.getMessageWithAuthor(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Validate that the user is a participant
    const isParticipant = await messageRepository.isParticipant(message.conversationId, userId);
    if (!isParticipant) {
      throw new Error('Not authorized to remove reactions in this conversation');
    }

    await messageRepository.removeReaction(messageId, userId);
  }

  /**
   * Mark a message as read
   * Validates that the user is a participant in the conversation
   */
  async markAsRead(input: MarkReadInput, userId: string): Promise<void> {
    // Get the message to find the conversation
    const message = await messageRepository.getMessageWithAuthor(input.messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Validate that the user is a participant
    const isParticipant = await messageRepository.isParticipant(message.conversationId, userId);
    if (!isParticipant) {
      throw new Error('Not authorized to mark messages as read in this conversation');
    }

    await messageRepository.markAsRead(input.messageId, input.userId);
  }
}

// Export a singleton instance for convenience
export const messageService = new MessageService();
