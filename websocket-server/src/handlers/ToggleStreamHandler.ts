import { WebSocket } from 'ws';
import { MessageHandler } from './MessageHandler';
import {
  MessageRequest,
  MessageResponse,
  isToggleStreamRequest,
  createObsStateResponse
} from '@websocket-demo/shared-types';
import { OBSService } from '../services/OBSService';

/**
 * Handler that toggles OBS streaming state.
 *
 * If OBS is currently streaming, it will stop; otherwise it will start.
 * Responds with an `obs-state` message indicating the new state.
 */
export class ToggleStreamHandler implements MessageHandler {
  private readonly obsService = OBSService.instance;

  canHandle(message: MessageRequest): boolean {
    return isToggleStreamRequest(message);
  }

  async handle(message: MessageRequest, ws: WebSocket): Promise<MessageResponse> {
    if (!isToggleStreamRequest(message)) {
      throw new Error('ToggleStreamHandler received incompatible message');
    }

    // Check if OBS integration is enabled
    if (!this.obsService.isEnabled) {
      return createObsStateResponse(false);
    }

    // Ensure we have an OBS connection first
    if (!this.obsService.isConnected) {
      await this.obsService.connect();
    }

    const newStreamingState = await this.obsService.toggleStreaming();

    return createObsStateResponse(newStreamingState);
  }

  getEventType(): string {
    return 'toggle-stream';
  }
}
