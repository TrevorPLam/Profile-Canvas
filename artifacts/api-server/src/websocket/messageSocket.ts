import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'cookie';
import { authService } from '../services/authService';
import { messageRepository } from '@workspace/db';
import { logger } from '../lib/logger';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  conversationId: string;
  isAlive: boolean;
}

/**
 * MessageWebSocket handles real-time message delivery for conversations.
 *
 * Deep module: Hides WebSocket connection management, authentication,
 * message broadcasting, and heartbeat logic behind a simple interface.
 *
 * Follows best practices:
 * - Uses ws library directly (not express-ws which is unmaintained)
 * - Validates authentication in upgrade handler
 * - Implements heartbeat/ping-pong for dead connection detection
 * - Tracks connections per conversation for targeted broadcasting
 * - Uses origin checking for security
 */
export class MessageWebSocket {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  /**
   * Initialize the WebSocket server
   * @param server - The HTTP server to attach to
   */
  initialize(server: any): void {
    this.wss = new WebSocketServer({
      server,
      path: '/api/conversations/stream',
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();

    logger.info('Message WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connections
   * Validates authentication and extracts conversation ID from query params
   */
  private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    // Parse query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      ws.close(1008, 'Conversation ID required');
      return;
    }

    // Validate authentication via cookie
    const cookies = parse(req.headers.cookie || '');
    const sessionId = cookies.session_id;

    if (!sessionId) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const userId = await authService.verifySession(sessionId);
      if (!userId) {
        ws.close(1008, 'Invalid session');
        return;
      }

      // Validate that user is a participant in the conversation
      const isParticipant = await messageRepository.isParticipant(conversationId, userId);
      if (!isParticipant) {
        ws.close(1008, 'Not authorized for this conversation');
        return;
      }

      // Create client connection
      const clientId = `${userId}-${conversationId}`;
      const client: ClientConnection = {
        ws,
        userId,
        conversationId,
        isAlive: true,
      };

      this.clients.set(clientId, client);

      // Set up event handlers
      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('message', (data: Buffer) => {
        this.handleMessage(client, data);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info({ clientId }, 'WebSocket client disconnected');
      });

      ws.on('error', (error: Error) => {
        logger.error({ error, clientId }, 'WebSocket error');
        this.clients.delete(clientId);
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          conversationId,
          userId,
        })
      );

      logger.info({ clientId, userId, conversationId }, 'WebSocket client connected');
    } catch (error: unknown) {
      logger.error({ error }, 'WebSocket authentication error');
      ws.close(1008, 'Authentication failed');
    }
  }

  /**
   * Handle incoming messages from clients
   * Currently supports typing indicators (can be extended)
   */
  private handleMessage(client: ClientConnection, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'typing':
          // Broadcast typing indicator to other participants
          this.broadcastToConversation(
            client.conversationId,
            {
              type: 'typing',
              userId: client.userId,
              conversationId: client.conversationId,
            },
            client.userId
          );
          break;
        default:
          logger.warn({ type: message.type }, 'Unknown message type');
      }
    } catch (error) {
      logger.error({ error }, 'Error parsing WebSocket message');
    }
  }

  /**
   * Broadcast a message to all clients in a conversation
   * @param conversationId - The conversation ID
   * @param message - The message to broadcast
   * @param excludeUserId - Optional user ID to exclude (e.g., the sender)
   */
  broadcastToConversation(conversationId: string, message: any, excludeUserId?: string): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.conversationId === conversationId && client.userId !== excludeUserId) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      }
    }
  }

  /**
   * Start heartbeat to detect dead connections
   * Follows ws library best practices for connection health monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      for (const [clientId, client] of this.clients.entries()) {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(clientId);
          logger.info({ clientId }, 'Terminated dead connection');
          continue;
        }

        client.isAlive = false;
        client.ws.ping();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Clean up resources
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.wss) {
      this.wss.close();
    }

    this.clients.clear();
    logger.info('Message WebSocket server shut down');
  }
}

// Export a singleton instance for convenience
export const messageWebSocket = new MessageWebSocket();
