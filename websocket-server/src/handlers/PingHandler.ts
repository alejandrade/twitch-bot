import { WebSocket } from 'ws';
import { MessageHandler } from './MessageHandler';
import { 
  MessageRequest, 
  MessageResponse, 
  isPingRequest, 
  createPongResponse 
} from '@websocket-demo/shared-types';

export class PingHandler implements MessageHandler {
  canHandle(message: MessageRequest): boolean {
    return isPingRequest(message);
  }

  handle(message: MessageRequest, ws: WebSocket): MessageResponse {
    if (!isPingRequest(message)) {
      throw new Error('PingHandler received non-ping message');
    }

    console.log(`PingHandler processing eventType: ${message.eventType}, eventBody:`, message.eventBody);
    
    return createPongResponse('pong', message.eventBody);
  }

  getEventType(): string {
    return 'ping';
  }
}