import { WebSocket } from 'ws';
import { MessageHandler } from './MessageHandler';
import { 
  MessageRequest, 
  MessageResponse, 
  isHelloRequest, 
  createHelloResponse 
} from '@websocket-demo/shared-types';

export class HelloHandler implements MessageHandler {
  canHandle(message: MessageRequest): boolean {
    return isHelloRequest(message);
  }

  async handle(message: MessageRequest, ws: WebSocket): Promise<MessageResponse> {
    if (!isHelloRequest(message)) {
      throw new Error('HelloHandler received non-hello message');
    }

    console.log(`HelloHandler processing eventType: ${message.eventType}, eventBody:`, message.eventBody);
    
    return createHelloResponse('world');
  }

  getEventType(): string {
    return 'hello';
  }
}