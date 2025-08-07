import { WebSocket } from 'ws';
import { MessageResponse, TwitchEvent } from '@websocket-demo/shared-types';

/**
 * Manages WebSocket connections and provides a clean interface for broadcasting messages.
 * 
 * - Tracks all active connections
 * - Provides methods to broadcast to all or specific clients
 * - Handles connection lifecycle (add/remove)
 * - Thread-safe operations
 */
export class WebSocketManager {
  private static _instance: WebSocketManager | null = null;
  private connections: Set<WebSocket> = new Set();

  private constructor() {}

  public static get instance(): WebSocketManager {
    if (!WebSocketManager._instance) {
      WebSocketManager._instance = new WebSocketManager();
    }
    return WebSocketManager._instance;
  }

  /**
   * Add a new WebSocket connection to the manager
   */
  public addConnection(ws: WebSocket): void {
    this.connections.add(ws);
    console.log(`WebSocketManager: Added connection. Total: ${this.connections.size}`);
  }

  /**
   * Remove a WebSocket connection from the manager
   */
  public removeConnection(ws: WebSocket): void {
    this.connections.delete(ws);
    console.log(`WebSocketManager: Removed connection. Total: ${this.connections.size}`);
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(message: MessageResponse | TwitchEvent): void {
    const messageJson = JSON.stringify(message);
    let sentCount = 0;

    for (const ws of this.connections) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageJson);
          sentCount++;
        } catch (error) {
          console.error('Failed to send message to client:', error);
          this.removeConnection(ws);
        }
      } else {
        // Clean up dead connections
        this.removeConnection(ws);
      }
    }

    if (sentCount > 0) {
      const eventType = 'eventType' in message ? message.eventType : message.type;
      console.log(`WebSocketManager: Broadcasted to ${sentCount} clients:`, eventType);
    }
  }

  /**
   * Send a message to a specific client
   */
  public sendToClient(ws: WebSocket, message: MessageResponse): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message to specific client:', error);
        this.removeConnection(ws);
      }
    } else {
      this.removeConnection(ws);
    }
  }

  /**
   * Get the current number of active connections
   */
  public getConnectionCount(): number {
    return this.connections.size;
  }
} 