import { eq, and } from 'drizzle-orm';
import { db, liveStreamsTable } from '@workspace/db';
import { randomUUID } from 'crypto';

// Streaming provider configuration
// In production, this would use AWS IVS, Mux, or similar service
const STREAMING_CONFIG = {
  rtmpBaseUrl: process.env.RTMP_BASE_URL || 'rtmp://live.example.com/live',
  playbackBaseUrl: process.env.PLAYBACK_BASE_URL || 'https://playback.example.com',
  maxConcurrentStreams: 1, // Limit concurrent streams per user
};

export interface StartLiveStreamInput {
  title: string;
  description?: string | null;
  enableRecording?: boolean;
}

export interface LiveStreamResponse {
  id: string;
  hostId: string;
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
  replayUrl: string | null;
  title: string;
  description: string | null;
  status: string;
  viewerCount: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export interface SendGiftInput {
  giftId: string;
  quantity?: number;
  message?: string | null;
}

export interface GiftResponse {
  id: string;
  streamId: string;
  senderId: string;
  giftId: string;
  quantity: number;
  message: string | null;
  monetaryValue: number;
  sentAt: string;
}

export interface LiveChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  sentAt: string;
}

export interface LiveChatResponse {
  messages: LiveChatMessage[];
  total: number;
}

// In-memory chat storage (in production, use Redis or similar)
const liveChatMessages = new Map<string, LiveChatMessage[]>();

export class LiveService {
  /**
   * Start a new live stream
   * Generates stream key and URLs for RTMP ingestion and HLS playback
   */
  async startStream(hostId: string, input: StartLiveStreamInput): Promise<LiveStreamResponse> {
    // Check for concurrent streams
    const activeStreams = await db
      .select()
      .from(liveStreamsTable)
      .where(
        and(
          eq(liveStreamsTable.hostId, hostId),
          eq(liveStreamsTable.status, 'active')
        )
      )
      .limit(1);

    if (activeStreams.length > 0) {
      throw new Error('Concurrent stream limit exceeded');
    }

    // Generate stream key (unique identifier for RTMP ingestion)
    const streamKey = randomUUID();
    const rtmpUrl = `${STREAMING_CONFIG.rtmpBaseUrl}/${streamKey}`;
    const playbackUrl = `${STREAMING_CONFIG.playbackBaseUrl}/${streamKey}/index.m3u8`;

    // Create live stream record
    const [stream] = await db
      .insert(liveStreamsTable)
      .values({
        hostId,
        streamKey,
        status: 'pending',
        viewerCount: 0,
        rtmpUrl,
        playbackUrl,
        title: input.title,
        description: input.description || null,
        enableRecording: input.enableRecording ? 'true' : 'false',
      })
      .returning();

    if (!stream) {
      throw new Error('Failed to create live stream');
    }

    return this.formatStreamResponse(stream);
  }

  /**
   * Get live stream details by ID
   */
  async getStream(streamId: string): Promise<LiveStreamResponse | null> {
    const streams = await db
      .select()
      .from(liveStreamsTable)
      .where(eq(liveStreamsTable.id, streamId))
      .limit(1);

    if (streams.length === 0) {
      return null;
    }

    return this.formatStreamResponse(streams[0]);
  }

  /**
   * End a live stream
   * Only the host can end their own stream
   * Generates replay URL if recording was enabled
   */
  async endStream(streamId: string, hostId: string): Promise<LiveStreamResponse | null> {
    const streams = await db
      .select()
      .from(liveStreamsTable)
      .where(eq(liveStreamsTable.id, streamId))
      .limit(1);

    if (streams.length === 0) {
      return null;
    }

    const stream = streams[0];

    // Verify ownership
    if (stream.hostId !== hostId) {
      throw new Error('Not authorized to end this stream');
    }

    // Generate replay URL if recording was enabled
    let replayUrl: string | null = null;
    if (stream.enableRecording === 'true') {
      replayUrl = `${STREAMING_CONFIG.playbackBaseUrl}/${stream.id}/replay.m3u8`;
    }

    // Update stream status
    const [updated] = await db
      .update(liveStreamsTable)
      .set({
        status: 'ended',
        endedAt: new Date(),
        replayUrl,
      })
      .where(eq(liveStreamsTable.id, streamId))
      .returning();

    if (!updated) {
      throw new Error('Failed to end live stream');
    }

    return this.formatStreamResponse(updated);
  }

  /**
   * Send a gift to a live stream
   * Updates creator's balance with monetary value
   * Note: This is a stub implementation. In production, this would:
   * - Validate sender's balance
   * - Deduct virtual currency from sender
   * - Add to creator's balance
   * - Emit real-time notification
   */
  async sendGift(
    streamId: string,
    senderId: string,
    input: SendGiftInput
  ): Promise<GiftResponse> {
    const streams = await db
      .select()
      .from(liveStreamsTable)
      .where(eq(liveStreamsTable.id, streamId))
      .limit(1);

    if (streams.length === 0) {
      throw new Error('Live stream not found');
    }

    const stream = streams[0];

    if (stream.status !== 'active') {
      throw new Error('Live stream is not active');
    }

    // Stub: Convert gift to monetary value
    // In production, this would look up gift type from a gifts table
    const monetaryValue = this.calculateGiftValue(input.giftId, input.quantity || 1);

    // Stub: Update creator balance
    // In production, this would update a user_balance table
    // await this.updateCreatorBalance(stream.hostId, monetaryValue);

    const giftId = randomUUID();
    const giftResponse: GiftResponse = {
      id: giftId,
      streamId,
      senderId,
      giftId: input.giftId,
      quantity: input.quantity || 1,
      message: input.message || null,
      monetaryValue,
      sentAt: new Date().toISOString(),
    };

    return giftResponse;
  }

  /**
   * Get live chat messages for a stream
   */
  async getChatMessages(streamId: string, limit: number = 50): Promise<LiveChatResponse> {
    const messages = liveChatMessages.get(streamId) || [];
    const total = messages.length;
    const recentMessages = messages.slice(-limit);

    return {
      messages: recentMessages,
      total,
    };
  }

  /**
   * Send a chat message to a live stream
   */
  async sendChatMessage(
    streamId: string,
    userId: string,
    username: string,
    message: string
  ): Promise<LiveChatMessage> {
    const streams = await db
      .select()
      .from(liveStreamsTable)
      .where(eq(liveStreamsTable.id, streamId))
      .limit(1);

    if (streams.length === 0) {
      throw new Error('Live stream not found');
    }

    const stream = streams[0];

    if (stream.status !== 'active') {
      throw new Error('Live stream is not active');
    }

    const chatMessage: LiveChatMessage = {
      id: randomUUID(),
      streamId,
      userId,
      username,
      message,
      sentAt: new Date().toISOString(),
    };

    // Add to in-memory storage
    if (!liveChatMessages.has(streamId)) {
      liveChatMessages.set(streamId, []);
    }
    liveChatMessages.get(streamId)!.push(chatMessage);

    return chatMessage;
  }

  /**
   * Update viewer count for a stream
   * Called by streaming provider webhook or periodic sync
   */
  async updateViewerCount(streamId: string, viewerCount: number): Promise<void> {
    await db
      .update(liveStreamsTable)
      .set({ viewerCount })
      .where(eq(liveStreamsTable.id, streamId));
  }

  /**
   * Mark stream as active when RTMP connection is established
   * Called by streaming provider webhook
   */
  async markStreamActive(streamId: string): Promise<void> {
    await db
      .update(liveStreamsTable)
      .set({
        status: 'active',
        startedAt: new Date(),
      })
      .where(eq(liveStreamsTable.id, streamId));
  }

  /**
   * Mark stream as failed if RTMP connection fails
   * Called by streaming provider webhook
   */
  async markStreamFailed(streamId: string): Promise<void> {
    await db
      .update(liveStreamsTable)
      .set({
        status: 'failed',
        endedAt: new Date(),
      })
      .where(eq(liveStreamsTable.id, streamId));
  }

  /**
   * Calculate monetary value of a gift
   * Stub implementation - in production, look up from gifts table
   */
  private calculateGiftValue(giftId: string, quantity: number): number {
    // Stub: Assume each gift is worth $0.01
    // In production, this would look up the gift type's value
    return quantity * 0.01;
  }

  /**
   * Format stream response from database record
   */
  private formatStreamResponse(stream: typeof liveStreamsTable.$inferSelect): LiveStreamResponse {
    return {
      id: stream.id,
      hostId: stream.hostId,
      streamKey: stream.streamKey,
      rtmpUrl: stream.rtmpUrl,
      playbackUrl: stream.playbackUrl,
      replayUrl: stream.replayUrl,
      title: stream.title,
      description: stream.description,
      status: stream.status,
      viewerCount: stream.viewerCount,
      startedAt: stream.startedAt?.toISOString() || null,
      endedAt: stream.endedAt?.toISOString() || null,
      createdAt: stream.createdAt.toISOString(),
    };
  }
}

// Export a singleton instance for convenience
export const liveService = new LiveService();
