import { WebSocket } from 'ws';
import { MessageRequest, MessageResponse } from '@websocket-demo/shared-types';

export interface MessageHandler {
  /**
   * Check if this handler can process the given message
   * @param message The incoming message request
   * @returns true if this handler can process the message
   */
  canHandle(message: MessageRequest): boolean;

  /**
   * Process the message and return a response
   * @param message The incoming message request
   * @param ws The WebSocket connection (for direct responses if needed)
   * @returns The response message to send back
   */
  handle(message: MessageRequest, ws: WebSocket): Promise<MessageResponse>;

  /**
   * Get the event type this handler processes (for logging/debugging)
   */
  getEventType(): string;
}