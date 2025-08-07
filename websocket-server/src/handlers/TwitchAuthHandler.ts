import { WebSocket } from 'ws';
import { MessageHandler } from './MessageHandler';
import { TwitchAuthService } from '../services/TwitchAuthService';
import { createTwitchAuthResponse, MessageRequest, MessageResponse } from '@websocket-demo/shared-types';

export class TwitchAuthHandler implements MessageHandler {
  private authService = TwitchAuthService.instance;

  canHandle(message: MessageRequest): boolean {
    return message.eventType === 'twitch_auth';
  }

  async handle(message: MessageRequest, ws: WebSocket): Promise<MessageResponse> {
    if (message.eventType !== 'twitch_auth') {
      throw new Error('TwitchAuthHandler received non-twitch_auth message');
    }

    const { action, ...params } = message.eventBody;

    switch (action) {
      case 'getAuthUrl':
        return await this.handleGetAuthUrl();
      
      case 'exchangeCode':
        if (!params.code) {
          return createTwitchAuthResponse(false, undefined, 'Code is required for exchangeCode');
        }
        return await this.handleExchangeCode(params.code, ws);
      
      case 'getAuthState':
        return await this.handleGetAuthState();
      
      case 'setChannel':
        if (!params.channel) {
          return createTwitchAuthResponse(false, undefined, 'Channel is required for setChannel');
        }
        return await this.handleSetChannel(params.channel);
      
      case 'logout':
        return await this.handleLogout();
      
      default:
        return createTwitchAuthResponse(false, undefined, `Unknown twitch_auth action: ${action}`);
    }
  }

  getEventType(): string {
    return 'twitch_auth';
  }

  private async handleGetAuthUrl(): Promise<MessageResponse> {
    try {
      const authUrl = this.authService.getAuthUrl();
      return createTwitchAuthResponse(true, undefined, undefined, { authUrl });
    } catch (error) {
      return createTwitchAuthResponse(false, undefined, `Failed to generate auth URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleExchangeCode(code: string, ws: WebSocket): Promise<MessageResponse> {
    try {
      const authState = await this.authService.exchangeCodeForToken(code);
      return createTwitchAuthResponse(true, 'Authentication successful', undefined, { authState });
    } catch (error) {
      return createTwitchAuthResponse(false, undefined, `Failed to exchange code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetAuthState(): Promise<MessageResponse> {
    try {
      const authState = this.authService.getAuthState();
      return createTwitchAuthResponse(true, undefined, undefined, { authState });
    } catch (error) {
      return createTwitchAuthResponse(false, undefined, `Failed to get auth state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSetChannel(channel: string): Promise<MessageResponse> {
    try {
      this.authService.setChannel(channel);
      return createTwitchAuthResponse(true, `Channel set to: ${channel}`);
    } catch (error) {
      return createTwitchAuthResponse(false, undefined, `Failed to set channel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleLogout(): Promise<MessageResponse> {
    try {
      this.authService.logout();
      return createTwitchAuthResponse(true, 'Logged out successfully');
    } catch (error) {
      return createTwitchAuthResponse(false, undefined, `Failed to logout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 