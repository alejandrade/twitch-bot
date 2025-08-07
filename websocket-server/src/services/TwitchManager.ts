import tmi, { ChatUserstate, Client } from 'tmi.js';
import { EventService } from './EventService';
import { TwitchAuthService } from './TwitchAuthService';

export interface ChatMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: Date;
  userState: ChatUserstate;
}

export interface SubscriptionEvent {
  id: string;
  username: string;
  displayName: string;
  type: 'new' | 'resub' | 'gift';
  months?: number;
  message?: string;
  timestamp: Date;
  isGift?: boolean;
  recipientUsername?: string;
}

export interface BitsEvent {
  id: string;
  username: string;
  displayName: string;
  bits: number;
  message?: string;
  timestamp: Date;
}

export interface FollowEvent {
  id: string;
  username: string;
  displayName: string;
  timestamp: Date;
}

export interface RaidEvent {
  id: string;
  username: string;
  displayName: string;
  viewers: number;
  timestamp: Date;
}

export interface HostEvent {
  id: string;
  username: string;
  displayName: string;
  viewers: number;
  timestamp: Date;
}

export type ChatMessageCallback = (message: ChatMessage) => void;
export type SubscriptionCallback = (event: SubscriptionEvent) => void;
export type BitsCallback = (event: BitsEvent) => void;
export type FollowCallback = (event: FollowEvent) => void;
export type RaidCallback = (event: RaidEvent) => void;
export type HostCallback = (event: HostEvent) => void;

/**
 * Service layer for interacting with Twitch chat as a bot.
 *
 * - Encapsulates Twitch IRC connection logic & state
 * - Exposes high-level operations for chat management
 * - Handles chat message processing and user management
 * - Supports subscriptions, bits, follows, raids, and hosts
 */
export class TwitchManager {
  /** Singleton instance */
  private static _instance: TwitchManager | null = null;

  /** TMI.js client for Twitch IRC */
  private client: Client;

  /** Current connection state */
  private _isConnected = false;

  /** Current chat state */
  private _isChatEnabled = false;

  /** Current chat message callback */
  private chatCallback: ChatMessageCallback | null = null;

  /** Event callbacks */
  private subscriptionCallback: SubscriptionCallback | null = null;
  private bitsCallback: BitsCallback | null = null;
  private followCallback: FollowCallback | null = null;
  private raidCallback: RaidCallback | null = null;
  private hostCallback: HostCallback | null = null;

  /** Target channel to join */
  private targetChannel: string = '';

  /** Auth service reference */
  private authService = TwitchAuthService.instance;

  private constructor() {
    this.client = tmi.Client({
      options: { debug: false },
      connection: {
        reconnect: true,
        secure: true
      },
      identity: {
        username: '', // Will be set from auth service
        password: ''  // Will be set from auth service
      },
      channels: []
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Retrieve (or lazily create) the singleton.
   */
  public static get instance(): TwitchManager {
    if (!TwitchManager._instance) {
      TwitchManager._instance = new TwitchManager();
    }
    return TwitchManager._instance;
  }

  /**
   * Connect to Twitch IRC using authenticated credentials.
   * @throws Error if connection fails or credentials are invalid
   */
  public async connect(): Promise<void> {
    if (this._isConnected) return; // idempotent

    if (!this.authService.isAuthenticated()) {
      throw new Error('Not authenticated with Twitch. Please authenticate first.');
    }

    const username = this.authService.getUsername();
    const accessToken = this.authService.getAccessToken();
    const channel = this.authService.getChannel();

    if (!username || !accessToken || !channel) {
      throw new Error('Missing authentication data. Please authenticate with Twitch first.');
    }

    // Recreate client with authenticated credentials
    this.client = tmi.Client({
      options: { debug: false },
      connection: {
        reconnect: true,
        secure: true
      },
      identity: {
        username: username,
        password: `oauth:${accessToken}`
      },
      channels: []
    });

    // Set up event handlers again
    this.setupEventHandlers();

    this.targetChannel = channel.toLowerCase();

    try {
      await this.client.connect();
      await this.client.join(this.targetChannel);
      this._isConnected = true;
      console.log(`Connected to Twitch as ${username} and joined ${this.targetChannel}`);
    } catch (error) {
      console.error('Failed to connect to Twitch:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Twitch IRC (idempotent).
   */
  public async disconnect(): Promise<void> {
    if (!this._isConnected) return;

    try {
      await this.client.disconnect();
      this._isConnected = false;
      this._isChatEnabled = false;
      this.chatCallback = null;
      this.subscriptionCallback = null;
      this.bitsCallback = null;
      this.followCallback = null;
      this.raidCallback = null;
      this.hostCallback = null;
      console.log('Disconnected from Twitch');
    } catch (error) {
      console.error('Error disconnecting from Twitch:', error);
    }
  }

  /**
   * Toggle chat message processing on/off.
   * @param callback Function to call with each chat message (or null to disable)
   */
  public toggleChat(callback: ChatMessageCallback | null): void {
    this.chatCallback = callback;
    this._isChatEnabled = callback !== null;
    
    if (this._isChatEnabled) {
      console.log('Chat message processing enabled');
    } else {
      console.log('Chat message processing disabled');
    }
  }

  /**
   * Set subscription event callback.
   * @param callback Function to call with subscription events (or null to disable)
   */
  public onSubscription(callback: SubscriptionCallback | null): void {
    this.subscriptionCallback = callback;
    console.log(callback ? 'Subscription events enabled' : 'Subscription events disabled');
  }

  /**
   * Set bits event callback.
   * @param callback Function to call with bits events (or null to disable)
   */
  public onBits(callback: BitsCallback | null): void {
    this.bitsCallback = callback;
    console.log(callback ? 'Bits events enabled' : 'Bits events disabled');
  }

  /**
   * Set follow event callback.
   * @param callback Function to call with follow events (or null to disable)
   */
  public onFollow(callback: FollowCallback | null): void {
    this.followCallback = callback;
    console.log(callback ? 'Follow events enabled' : 'Follow events disabled');
  }

  /**
   * Set raid event callback.
   * @param callback Function to call with raid events (or null to disable)
   */
  public onRaid(callback: RaidCallback | null): void {
    this.raidCallback = callback;
    console.log(callback ? 'Raid events enabled' : 'Raid events disabled');
  }

  /**
   * Set host event callback.
   * @param callback Function to call with host events (or null to disable)
   */
  public onHost(callback: HostCallback | null): void {
    this.hostCallback = callback;
    console.log(callback ? 'Host events enabled' : 'Host events disabled');
  }

  /**
   * Kick a user from the channel.
   * @param username Username to kick
   * @param reason Optional reason for the kick
   */
  public async kickUser(username: string, reason?: string): Promise<void> {
    this.ensureConnected();
    
    try {
      await this.client.ban(this.targetChannel, username, reason);
      console.log(`Kicked user: ${username}${reason ? ` (Reason: ${reason})` : ''}`);
    } catch (error) {
      console.error(`Failed to kick user ${username}:`, error);
      throw error;
    }
  }

  /**
   * Ban a user from the channel.
   * @param username Username to ban
   * @param reason Optional reason for the ban
   */
  public async banUser(username: string, reason?: string): Promise<void> {
    this.ensureConnected();
    
    try {
      await this.client.ban(this.targetChannel, username, reason);
      console.log(`Banned user: ${username}${reason ? ` (Reason: ${reason})` : ''}`);
    } catch (error) {
      console.error(`Failed to ban user ${username}:`, error);
      throw error;
    }
  }

  /**
   * Unban a user from the channel.
   * @param username Username to unban
   */
  public async unbanUser(username: string): Promise<void> {
    this.ensureConnected();
    
    try {
      await this.client.unban(this.targetChannel, username);
      console.log(`Unbanned user: ${username}`);
    } catch (error) {
      console.error(`Failed to unban user ${username}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to the channel.
   * @param message Message to send
   */
  public async sendMessage(message: string): Promise<void> {
    this.ensureConnected();
    
    try {
      await this.client.say(this.targetChannel, message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get current connection state.
   */
  public get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get current chat processing state.
   */
  public get isChatEnabled(): boolean {
    return this._isChatEnabled;
  }

  /**
   * Get the target channel name.
   */
  public get channel(): string {
    return this.targetChannel;
  }

  /**
   * Set up TMI.js event handlers.
   */
  private setupEventHandlers(): void {
    // Handle incoming chat messages
    this.client.on('message', (channel, tags, message, self) => {
      if (self) return; // Ignore our own messages
      if (!this._isChatEnabled || !this.chatCallback) return;

      const chatMessage: ChatMessage = {
        id: tags.id || `${Date.now()}-${Math.random()}`,
        username: tags.username || 'unknown',
        displayName: tags['display-name'] || tags.username || 'unknown',
        message: message,
        timestamp: new Date(),
        userState: tags
      };

      try {
        this.chatCallback(chatMessage);
      } catch (error) {
        console.error('Error in chat message callback:', error);
      }
    });

    // Handle subscription events
    this.client.on('subscription', (channel, username, method, message, userstate) => {
      const subscriptionEvent: SubscriptionEvent = {
        id: userstate.id || `${Date.now()}-${Math.random()}`,
        username: username,
        displayName: userstate['display-name'] || username,
        type: 'new',
        message: message,
        timestamp: new Date()
      };

      // Broadcast to all connected clients
      EventService.instance.broadcastSubscriptionEvent(subscriptionEvent);

      // Call local callback if set
      if (this.subscriptionCallback) {
        try {
          this.subscriptionCallback(subscriptionEvent);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      }
    });

    // Handle resubscription events
    this.client.on('resub', (channel, username, months, message, userstate, methods) => {
      const subscriptionEvent: SubscriptionEvent = {
        id: userstate.id || `${Date.now()}-${Math.random()}`,
        username: username,
        displayName: userstate['display-name'] || username,
        type: 'resub',
        months: months,
        message: message,
        timestamp: new Date()
      };

      // Broadcast to all connected clients
      EventService.instance.broadcastSubscriptionEvent(subscriptionEvent);

      // Call local callback if set
      if (this.subscriptionCallback) {
        try {
          this.subscriptionCallback(subscriptionEvent);
        } catch (error) {
          console.error('Error in resubscription callback:', error);
        }
      }
    });

    // Handle gift subscription events
    this.client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
      const subscriptionEvent: SubscriptionEvent = {
        id: userstate.id || `${Date.now()}-${Math.random()}`,
        username: username,
        displayName: userstate['display-name'] || username,
        type: 'gift',
        isGift: true,
        recipientUsername: recipient,
        timestamp: new Date()
      };

      // Broadcast to all connected clients
      EventService.instance.broadcastSubscriptionEvent(subscriptionEvent);

      // Call local callback if set
      if (this.subscriptionCallback) {
        try {
          this.subscriptionCallback(subscriptionEvent);
        } catch (error) {
          console.error('Error in gift subscription callback:', error);
        }
      }
    });

    // Handle bits/cheer events
    this.client.on('cheer', (channel, userstate, message) => {
      const bitsEvent: BitsEvent = {
        id: userstate.id || `${Date.now()}-${Math.random()}`,
        username: userstate.username || 'unknown',
        displayName: userstate['display-name'] || userstate.username || 'unknown',
        bits: parseInt(userstate.bits || '0'),
        message: message,
        timestamp: new Date()
      };

      // Broadcast to all connected clients
      EventService.instance.broadcastBitsEvent(bitsEvent);

      // Call local callback if set
      if (this.bitsCallback) {
        try {
          this.bitsCallback(bitsEvent);
        } catch (error) {
          console.error('Error in bits callback:', error);
        }
      }
    });

    // Handle follow events
    this.client.on('followersonly', (channel, enabled) => {
      // This event is for follow-only mode, not individual follows
      console.log(`Follow-only mode ${enabled ? 'enabled' : 'disabled'} in ${channel}`);
    });

    // Handle raid events
    this.client.on('raided', (channel, username, viewers) => {
      const raidEvent: RaidEvent = {
        id: `${Date.now()}-${Math.random()}`,
        username: username,
        displayName: username,
        viewers: viewers,
        timestamp: new Date()
      };

      // Broadcast to all connected clients
      EventService.instance.broadcastRaidEvent(raidEvent);

      // Call local callback if set
      if (this.raidCallback) {
        try {
          this.raidCallback(raidEvent);
        } catch (error) {
          console.error('Error in raid callback:', error);
        }
      }
    });

    // Handle host events
    this.client.on('hosted', (channel, username, viewers, autohost) => {
      const hostEvent: HostEvent = {
        id: `${Date.now()}-${Math.random()}`,
        username: username,
        displayName: username,
        viewers: viewers,
        timestamp: new Date()
      };

      // Broadcast to all connected clients
      EventService.instance.broadcastHostEvent(hostEvent);

      // Call local callback if set
      if (this.hostCallback) {
        try {
          this.hostCallback(hostEvent);
        } catch (error) {
          console.error('Error in host callback:', error);
        }
      }
    });

    // Handle connection events
    this.client.on('connected', (addr, port) => {
      console.log(`Connected to Twitch IRC at ${addr}:${port}`);
    });

    this.client.on('disconnected', (reason) => {
      console.log(`Disconnected from Twitch IRC: ${reason}`);
      this._isConnected = false;
    });
  }

  /**
   * Ensure we're connected before performing operations.
   */
  private ensureConnected(): void {
    if (!this._isConnected) {
      throw new Error('Not connected to Twitch IRC. Call connect() first.');
    }
  }
} 