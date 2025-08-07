import { WebSocket } from 'ws';
import { MessageHandler } from './MessageHandler';
import { TwitchManager, ChatMessage } from '../services/TwitchManager';
import { 
  createTwitchConnectResponse, 
  createTwitchDisconnectResponse, 
  createTwitchToggleChatResponse,
  MessageRequest, 
  MessageResponse, 
  isTwitchRequest 
} from '@websocket-demo/shared-types';

export class TwitchHandler implements MessageHandler {
  private twitchManager = TwitchManager.instance;

  canHandle(message: MessageRequest): boolean {
    return message.eventType === 'twitch';
  }

  async handle(message: MessageRequest, ws: WebSocket): Promise<MessageResponse> {
    if (!isTwitchRequest(message)) {
      throw new Error('TwitchHandler received non-twitch message');
    }

    const { action, ...params } = message.eventBody;

    switch (action) {
      case 'connect':
        return await this.handleConnect(ws);
      
      case 'disconnect':
        return await this.handleDisconnect(ws);
      
      case 'toggleChat':
        return await this.handleToggleChat(params.enabled ?? false, ws);
      
      case 'toggleSubscriptions':
        return await this.handleToggleSubscriptions(params.enabled ?? false);
      
      case 'toggleBits':
        return await this.handleToggleBits(params.enabled ?? false);
      
      case 'toggleFollows':
        return await this.handleToggleFollows(params.enabled ?? false);
      
      case 'toggleRaids':
        return await this.handleToggleRaids(params.enabled ?? false);
      
      case 'toggleHosts':
        return await this.handleToggleHosts(params.enabled ?? false);
      
      case 'kickUser':
        if (!params.username) {
          return createTwitchConnectResponse(false, false, undefined, 'Username is required for kickUser');
        }
        return await this.handleKickUser(params.username, params.reason);
      
      case 'banUser':
        if (!params.username) {
          return createTwitchConnectResponse(false, false, undefined, 'Username is required for banUser');
        }
        return await this.handleBanUser(params.username, params.reason);
      
      case 'unbanUser':
        if (!params.username) {
          return createTwitchConnectResponse(false, false, undefined, 'Username is required for unbanUser');
        }
        return await this.handleUnbanUser(params.username);
      
      case 'sendMessage':
        if (!params.message) {
          return createTwitchConnectResponse(false, false, undefined, 'Message is required for sendMessage');
        }
        return await this.handleSendMessage(params.message);
      
      case 'getStatus':
        return await this.handleGetStatus();
      
      default:
        return createTwitchConnectResponse(false, false, undefined, `Unknown twitch action: ${action}`);
    }
  }

  getEventType(): string {
    return 'twitch';
  }

  private async handleConnect(ws: WebSocket): Promise<MessageResponse> {
    try {
      await this.twitchManager.connect();
      return createTwitchConnectResponse(true, true, 'Connected to Twitch successfully');
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to connect to Twitch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleDisconnect(ws: WebSocket): Promise<MessageResponse> {
    try {
      await this.twitchManager.disconnect();
      return createTwitchDisconnectResponse(true, false, 'Disconnected from Twitch successfully');
    } catch (error) {
      return createTwitchDisconnectResponse(false, true, undefined, `Failed to disconnect from Twitch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleToggleChat(enabled: boolean, ws: WebSocket): Promise<MessageResponse> {
    try {
      if (enabled) {
        // Enable chat processing with callback that sends messages to the client
        this.twitchManager.toggleChat((message: ChatMessage) => {
          const chatEvent = {
            type: 'twitch_chat_message',
            data: message
          };
          ws.send(JSON.stringify(chatEvent));
        });
      } else {
        // Disable chat processing
        this.twitchManager.toggleChat(null);
      }

      return createTwitchToggleChatResponse(true, enabled, `Chat processing ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      return createTwitchToggleChatResponse(false, !enabled, undefined, `Failed to toggle chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleKickUser(username: string, reason?: string): Promise<MessageResponse> {
    try {
      await this.twitchManager.kickUser(username, reason);
      return createTwitchConnectResponse(true, true, `Kicked user ${username}`);
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to kick user ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleBanUser(username: string, reason?: string): Promise<MessageResponse> {
    try {
      await this.twitchManager.banUser(username, reason);
      return createTwitchConnectResponse(true, true, `Banned user ${username}`);
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to ban user ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleUnbanUser(username: string): Promise<MessageResponse> {
    try {
      await this.twitchManager.unbanUser(username);
      return createTwitchConnectResponse(true, true, `Unbanned user ${username}`);
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to unban user ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSendMessage(message: string): Promise<MessageResponse> {
    try {
      await this.twitchManager.sendMessage(message);
      return createTwitchConnectResponse(true, true, 'Message sent successfully');
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetStatus(): Promise<MessageResponse> {
    try {
      const isConnected = this.twitchManager.isConnected;
      return createTwitchConnectResponse(true, isConnected, `Twitch connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to get status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleToggleSubscriptions(enabled: boolean): Promise<MessageResponse> {
    try {
      this.twitchManager.onSubscription(enabled ? (event) => {
        console.log('Subscription event:', event);
      } : null);
      return createTwitchConnectResponse(true, true, `Subscription events ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to toggle subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleToggleBits(enabled: boolean): Promise<MessageResponse> {
    try {
      this.twitchManager.onBits(enabled ? (event) => {
        console.log('Bits event:', event);
      } : null);
      return createTwitchConnectResponse(true, true, `Bits events ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to toggle bits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleToggleFollows(enabled: boolean): Promise<MessageResponse> {
    try {
      this.twitchManager.onFollow(enabled ? (event) => {
        console.log('Follow event:', event);
      } : null);
      return createTwitchConnectResponse(true, true, `Follow events ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to toggle follows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleToggleRaids(enabled: boolean): Promise<MessageResponse> {
    try {
      this.twitchManager.onRaid(enabled ? (event) => {
        console.log('Raid event:', event);
      } : null);
      return createTwitchConnectResponse(true, true, `Raid events ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to toggle raids: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleToggleHosts(enabled: boolean): Promise<MessageResponse> {
    try {
      this.twitchManager.onHost(enabled ? (event) => {
        console.log('Host event:', event);
      } : null);
      return createTwitchConnectResponse(true, true, `Host events ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      return createTwitchConnectResponse(false, false, undefined, `Failed to toggle hosts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 