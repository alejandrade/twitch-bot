import { WebSocket } from 'ws';
import { MessageHandler } from './MessageHandler';
import { 
  MessageRequest, 
  MessageResponse, 
  createErrorResponse 
} from '@websocket-demo/shared-types';

export class MessageHandlerRegistry {
  private handlers: MessageHandler[] = [];

  /**
   * Register a message handler
   * @param handler The handler to register
   */
  register(handler: MessageHandler): void {
    this.handlers.push(handler);
    console.log(`Registered handler for event type: ${handler.getEventType()}`);
  }

  /**
   * Parse incoming raw message and process it
   * @param rawMessage The incoming raw message string
   * @param ws The WebSocket connection
   * @returns The response message
   */
  processRawMessage(rawMessage: string, ws: WebSocket): MessageResponse {
    console.log(`Processing raw message: ${rawMessage}`);
    
    try {
      const messageRequest: MessageRequest = JSON.parse(rawMessage);
      return this.processMessage(messageRequest, ws);
    } catch (error) {
      console.error(`Invalid JSON message: ${rawMessage}`, error);
      return createErrorResponse('Invalid JSON format', undefined, rawMessage);
    }
  }

  /**
   * Process a typed message by finding the appropriate handler
   * @param message The incoming message request
   * @param ws The WebSocket connection
   * @returns The response message
   */
  processMessage(message: MessageRequest, ws: WebSocket): MessageResponse {
    console.log(`Processing message eventType: ${message.eventType}, eventBody:`, message.eventBody);
    
    for (const handler of this.handlers) {
      if (handler.canHandle(message)) {
        console.log(`Handler found: ${handler.getEventType()}`);
        return handler.handle(message, ws);
      }
    }
    
    console.log(`No handler found for eventType: ${message.eventType}`);
    return createErrorResponse('Unknown event type', message.eventType);
  }

  /**
   * Get all registered handlers (for debugging)
   */
  getRegisteredHandlers(): MessageHandler[] {
    return [...this.handlers];
  }

  /**
   * Get registered event types (for debugging)
   */
  getRegisteredEventTypes(): string[] {
    return this.handlers.map(handler => handler.getEventType());
  }
}