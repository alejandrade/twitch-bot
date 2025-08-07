import OBSWebSocket, { OBSWebSocketError } from 'obs-websocket-js';
import { EventService } from './EventService';

/**
 * Service layer for interacting with a local OBS Studio instance via obs-websocket.
 *
 * - Encapsulates connection logic & state
 * - Exposes high-level operations used by handlers / controllers
 * - Keeps the rest of the codebase independent from the underlying SDK
 */
export class OBSService {
  /** Singleton instance (simple DI replacement) */
  private static _instance: OBSService | null = null;

  /** obs-websocket client */
  private readonly obs = new OBSWebSocket();

  /** Cached connection state */
  private _isConnected = false;

  /** Whether OBS integration is enabled */
  private readonly _isEnabled: boolean;

  private constructor() {
    // Check if OBS integration is enabled
    this._isEnabled = process.env.OBS_INTEGRATION_ENABLED !== 'false';

    // Listen for disconnects so we keep our state in sync
    this.obs.on('ConnectionClosed', () => {
      this._isConnected = false;
    });

    // Listen for OBS state changes and broadcast them
    // Note: These events may not be available in all OBS versions
    // We'll handle this gracefully by checking if the events exist
    try {
      this.obs.on('StreamStarting' as any, () => {
        EventService.instance.broadcastObsState(true);
      });

      this.obs.on('StreamStarted' as any, () => {
        EventService.instance.broadcastObsState(true);
      });

      this.obs.on('StreamStopping' as any, () => {
        EventService.instance.broadcastObsState(false);
      });

      this.obs.on('StreamStopped' as any, () => {
        EventService.instance.broadcastObsState(false);
      });
    } catch (error) {
      console.warn('Some OBS stream events not available:', error);
    }
  }

  /**
   * Retrieve (or lazily create) the singleton.
   */
  public static get instance(): OBSService {
    if (!OBSService._instance) {
      OBSService._instance = new OBSService();
    }
    return OBSService._instance;
  }

  /**
   * Connect to OBS Studio (default localhost:4455).
   * @throws OBSWebSocketError If connection fails or wrong password
   */
  public async connect(
    url: string = process.env.OBS_URL ?? 'ws://127.0.0.1:4455',
    password: string | undefined = process.env.OBS_PASSWORD,
  ): Promise<void> {
    if (!this._isEnabled) {
      console.log('OBS integration is disabled, skipping connection');
      return;
    }

    if (this._isConnected) return; // idempotent

    await this.obs.connect(url, password);
    this._isConnected = true;
  }

  /**
   * Disconnect if currently connected (idempotent).
   */
  public async disconnect(): Promise<void> {
    if (!this._isConnected) return;

    await this.obs.disconnect();
    this._isConnected = false;
  }

  /**
   * Quick connection state accessor.
   */
  public get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Check if OBS integration is enabled.
   */
  public get isEnabled(): boolean {
    return this._isEnabled;
  }

  /**
   * Start the configured streaming service in OBS.
   * @throws Error if not connected or OBS rejects the request
   */
  public async startStreaming(): Promise<void> {
    if (!this._isEnabled) {
      throw new Error('OBS integration is disabled');
    }
    this.ensureConnected();
    await this.obs.call('StartStream');
  }

  /** Stop streaming if currently active */
  public async stopStreaming(): Promise<void> {
    if (!this._isEnabled) {
      throw new Error('OBS integration is disabled');
    }
    this.ensureConnected();
    await this.obs.call('StopStream');
  }

  /** Check whether OBS is currently streaming */
  public async isStreaming(): Promise<boolean> {
    if (!this._isEnabled) {
      return false; // Always return false when disabled
    }
    this.ensureConnected();
    const { outputActive } = await this.obs.call('GetStreamStatus');
    return Boolean((outputActive as unknown) ?? false);
  }

  /** Toggle streaming; returns the new streaming state */
  public async toggleStreaming(): Promise<boolean> {
    if (!this._isEnabled) {
      throw new Error('OBS integration is disabled');
    }
    const currentlyStreaming = await this.isStreaming();
    if (currentlyStreaming) {
      await this.stopStreaming();
      return false;
    }
    await this.startStreaming();
    return true;
  }

  /**
   * Ensure we have a live connection before attempting an API call.
   */
  private ensureConnected(): void {
    if (!this._isConnected) {
      throw new Error('OBSService is not connected to OBS. Call connect() first.');
    }
  }
}
