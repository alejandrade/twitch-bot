import { EventService } from './EventService';

export interface TwitchAuthState {
  isAuthenticated: boolean;
  username?: string;
  accessToken?: string;
  channel?: string;
  expiresAt?: Date;
}

export interface TwitchAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Service for handling Twitch OAuth authentication
 */
export class TwitchAuthService {
  private static _instance: TwitchAuthService | null = null;
  private authState: TwitchAuthState = { isAuthenticated: false };
  private config: TwitchAuthConfig;

  private constructor() {
    this.config = {
      clientId: process.env.TWITCH_CLIENT_ID || '',
      clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
      redirectUri: process.env.TWITCH_REDIRECT_URI || 'http://localhost:3000/auth/callback'
    };
  }

  public static get instance(): TwitchAuthService {
    if (!TwitchAuthService._instance) {
      TwitchAuthService._instance = new TwitchAuthService();
    }
    return TwitchAuthService._instance;
  }

  /**
   * Generate OAuth authorization URL
   */
  public getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'chat:read chat:edit channel:moderate',
      state: this.generateState()
    });

    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(code: string): Promise<TwitchAuthState> {
    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Get user info
      const userInfo = await this.getUserInfo(data.access_token);
      
      this.authState = {
        isAuthenticated: true,
        username: userInfo.login,
        accessToken: data.access_token,
        channel: userInfo.login, // Default to user's own channel
        expiresAt: new Date(Date.now() + data.expires_in * 1000)
      };

      // Broadcast auth state change
      EventService.instance.broadcastTwitchAuthState(this.authState);

      return this.authState;
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  /**
   * Get user information from Twitch API
   */
  private async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': this.config.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0];
  }

  /**
   * Get current authentication state
   */
  public getAuthState(): TwitchAuthState {
    return { ...this.authState };
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return Boolean(this.authState.isAuthenticated && 
           this.authState.accessToken && 
           this.authState.expiresAt && 
           this.authState.expiresAt > new Date());
  }

  /**
   * Get access token for API calls
   */
  public getAccessToken(): string | null {
    if (this.isAuthenticated()) {
      return this.authState.accessToken || null;
    }
    return null;
  }

  /**
   * Get username
   */
  public getUsername(): string | null {
    return this.authState.username || null;
  }

  /**
   * Get channel name
   */
  public getChannel(): string | null {
    return this.authState.channel || null;
  }

  /**
   * Set channel name
   */
  public setChannel(channel: string): void {
    this.authState.channel = channel;
    EventService.instance.broadcastTwitchAuthState(this.authState);
  }

  /**
   * Logout user
   */
  public logout(): void {
    this.authState = { isAuthenticated: false };
    EventService.instance.broadcastTwitchAuthState(this.authState);
  }

  /**
   * Generate random state for OAuth security
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
} 