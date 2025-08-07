import { WebSocketManager } from './WebSocketManager';
import { 
  createObsStateResponse, 
  createTwitchAuthStateResponse,
  createTwitchSubscriptionEvent,
  createTwitchBitsEvent,
  createTwitchFollowEvent,
  createTwitchRaidEvent,
  createTwitchHostEvent
} from '@websocket-demo/shared-types';
import { TwitchAuthState } from './TwitchAuthService';
import { SubscriptionEvent, BitsEvent, FollowEvent, RaidEvent, HostEvent } from './TwitchManager';

/**
 * Service for broadcasting different types of events to connected clients.
 * 
 * Provides a clean interface for different parts of the system to broadcast
 * events without needing to know about WebSocket details.
 */
export class EventService {
  private static _instance: EventService | null = null;
  private readonly wsManager = WebSocketManager.instance;

  private constructor() {}

  public static get instance(): EventService {
    if (!EventService._instance) {
      EventService._instance = new EventService();
    }
    return EventService._instance;
  }

  /**
   * Broadcast OBS state changes to all connected clients
   */
  public broadcastObsState(streaming: boolean): void {
    const message = createObsStateResponse(streaming);
    this.wsManager.broadcast(message);
  }

  /**
   * Send initial OBS state to a specific client (e.g., on connection)
   */
  public sendInitialObsState(streaming: boolean, ws: any): void {
    const message = createObsStateResponse(streaming);
    this.wsManager.sendToClient(ws, message);
  }

  /**
   * Broadcast Twitch authentication state to all connected clients
   */
  public broadcastTwitchAuthState(authState: TwitchAuthState): void {
    const message = createTwitchAuthStateResponse(authState);
    this.wsManager.broadcast(message);
  }

  /**
   * Send Twitch authentication state to a specific client
   */
  public sendTwitchAuthState(authState: TwitchAuthState, ws: any): void {
    const message = createTwitchAuthStateResponse(authState);
    this.wsManager.sendToClient(ws, message);
  }

  /**
   * Broadcast subscription events to all connected clients
   */
  public broadcastSubscriptionEvent(event: SubscriptionEvent): void {
    const message = createTwitchSubscriptionEvent({
      id: event.id,
      username: event.username,
      displayName: event.displayName,
      type: event.type,
      months: event.months,
      message: event.message,
      timestamp: event.timestamp.toISOString(),
      isGift: event.isGift,
      recipientUsername: event.recipientUsername
    });
    this.wsManager.broadcast(message);
  }

  /**
   * Broadcast bits events to all connected clients
   */
  public broadcastBitsEvent(event: BitsEvent): void {
    const message = createTwitchBitsEvent({
      id: event.id,
      username: event.username,
      displayName: event.displayName,
      bits: event.bits,
      message: event.message,
      timestamp: event.timestamp.toISOString()
    });
    this.wsManager.broadcast(message);
  }

  /**
   * Broadcast follow events to all connected clients
   */
  public broadcastFollowEvent(event: FollowEvent): void {
    const message = createTwitchFollowEvent({
      id: event.id,
      username: event.username,
      displayName: event.displayName,
      timestamp: event.timestamp.toISOString()
    });
    this.wsManager.broadcast(message);
  }

  /**
   * Broadcast raid events to all connected clients
   */
  public broadcastRaidEvent(event: RaidEvent): void {
    const message = createTwitchRaidEvent({
      id: event.id,
      username: event.username,
      displayName: event.displayName,
      viewers: event.viewers,
      timestamp: event.timestamp.toISOString()
    });
    this.wsManager.broadcast(message);
  }

  /**
   * Broadcast host events to all connected clients
   */
  public broadcastHostEvent(event: HostEvent): void {
    const message = createTwitchHostEvent({
      id: event.id,
      username: event.username,
      displayName: event.displayName,
      viewers: event.viewers,
      timestamp: event.timestamp.toISOString()
    });
    this.wsManager.broadcast(message);
  }
} 