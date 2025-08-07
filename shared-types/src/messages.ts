// Base message interface - never used directly, only extended
interface BaseMessage<TEventType extends string, TEventBody> {
  eventType: TEventType;
  eventBody: TEventBody;
}

// ===== REQUEST MESSAGES =====

// Hello request body type
export interface HelloRequestBody {
  userMessage: string;
  timestamp: string;
}

// Ping request body type  
export interface PingRequestBody {
  userMessage: string;
  timestamp: string;
}

// Specific request message types
export interface HelloRequest extends BaseMessage<'hello', HelloRequestBody> {}
export interface PingRequest extends BaseMessage<'ping', PingRequestBody> {}

// Union type of all possible request messages
export type MessageRequest = HelloRequest | PingRequest | ToggleStreamRequest | TwitchRequest | TwitchAuthRequest;

// ===== RESPONSE MESSAGES =====

// Hello response body type
export interface HelloResponseBody {
  message: string;
  timestamp: string;
}

// Pong response body type
export interface PongResponseBody {
  message: string;
  originalBody: HelloRequestBody | PingRequestBody;
  timestamp: string;
}

// Error response body type
export interface ErrorResponseBody {
  message: string;
  eventType?: string;
  originalMessage?: string;
  timestamp: string;
}

// Specific response message types
export interface HelloResponse extends BaseMessage<'hello-response', HelloResponseBody> {}
export interface PongResponse extends BaseMessage<'pong-response', PongResponseBody> {}
export interface ErrorResponse extends BaseMessage<'error', ErrorResponseBody> {}

// Union type of all possible response messages  
export type MessageResponse = HelloResponse | PongResponse | ErrorResponse | ObsStateResponse | TwitchConnectResponse | TwitchDisconnectResponse | TwitchToggleChatResponse | TwitchAuthResponse | TwitchAuthStateResponse;

// ===== UTILITY TYPES =====

// Union of all possible messages (requests and responses)
export type AllMessages = MessageRequest | MessageResponse;

// Type guards for message identification
export function isHelloRequest(message: MessageRequest): message is HelloRequest {
  return message.eventType === 'hello';
}

export function isPingRequest(message: MessageRequest): message is PingRequest {
  return message.eventType === 'ping';
}

export function isHelloResponse(message: MessageResponse): message is HelloResponse {
  return message.eventType === 'hello-response';
}

export function isPongResponse(message: MessageResponse): message is PongResponse {
  return message.eventType === 'pong-response';
}

export function isErrorResponse(message: MessageResponse): message is ErrorResponse {
  return message.eventType === 'error';
}

// ===== MESSAGE CREATION HELPERS =====

export function createHelloRequest(userMessage: string): HelloRequest {
  return {
    eventType: 'hello',
    eventBody: {
      userMessage,
      timestamp: new Date().toISOString()
    }
  };
}

export function createPingRequest(userMessage: string): PingRequest {
  return {
    eventType: 'ping',
    eventBody: {
      userMessage,
      timestamp: new Date().toISOString()
    }
  };
}

export function createHelloResponse(message: string): HelloResponse {
  return {
    eventType: 'hello-response',
    eventBody: {
      message,
      timestamp: new Date().toISOString()
    }
  };
}

export function createPongResponse(message: string, originalBody: HelloRequestBody | PingRequestBody): PongResponse {
  return {
    eventType: 'pong-response',
    eventBody: {
      message,
      originalBody,
      timestamp: new Date().toISOString()
    }
  };
}

export function createErrorResponse(message: string, eventType?: string, originalMessage?: string): ErrorResponse {
  return {
    eventType: 'error',
    eventBody: {
      message,
      eventType,
      originalMessage,
      timestamp: new Date().toISOString()
    }
  };
}

/* ===== OBS STREAMING MESSAGES ===== */

export interface ToggleStreamRequestBody {
  timestamp: string;
}

export interface ToggleStreamRequest extends BaseMessage<'toggle-stream', ToggleStreamRequestBody> {}

export interface ObsStateResponseBody {
  streaming: boolean;
  timestamp: string;
}

export interface ObsStateResponse extends BaseMessage<'obs-state', ObsStateResponseBody> {}

// Type guards
export function isToggleStreamRequest(message: MessageRequest): message is ToggleStreamRequest {
  return message.eventType === 'toggle-stream';
}

export function isObsStateResponse(message: MessageResponse): message is ObsStateResponse {
  return message.eventType === 'obs-state';
}

// Message builders
export function createObsStateResponse(streaming: boolean): ObsStateResponse {
  return {
    eventType: 'obs-state',
    eventBody: {
      streaming,
      timestamp: new Date().toISOString()
    }
  };
}

export function createToggleStreamRequest(): ToggleStreamRequest {
  return {
    eventType: 'toggle-stream',
    eventBody: {
      timestamp: new Date().toISOString()
    }
  };
}

/* ===== TWITCH MESSAGES ===== */

export interface TwitchRequestBody {
  action: 'connect' | 'disconnect' | 'toggleChat' | 'toggleSubscriptions' | 'toggleBits' | 'toggleFollows' | 'toggleRaids' | 'toggleHosts' | 'kickUser' | 'banUser' | 'unbanUser' | 'sendMessage' | 'getStatus';
  enabled?: boolean;
  username?: string;
  reason?: string;
  message?: string;
  timestamp: string;
}

export interface TwitchRequest extends BaseMessage<'twitch', TwitchRequestBody> {}

// Specific Twitch response types
export interface TwitchConnectResponseBody {
  success: boolean;
  connected: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface TwitchConnectResponse extends BaseMessage<'twitch-connect-response', TwitchConnectResponseBody> {}

export interface TwitchDisconnectResponseBody {
  success: boolean;
  connected: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface TwitchDisconnectResponse extends BaseMessage<'twitch-disconnect-response', TwitchDisconnectResponseBody> {}

export interface TwitchToggleChatResponseBody {
  success: boolean;
  chatEnabled: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface TwitchToggleChatResponse extends BaseMessage<'twitch-toggle-chat-response', TwitchToggleChatResponseBody> {}

// Type guards
export function isTwitchRequest(message: MessageRequest): message is TwitchRequest {
  return message.eventType === 'twitch';
}

export function isTwitchConnectResponse(message: MessageResponse): message is TwitchConnectResponse {
  return message.eventType === 'twitch-connect-response';
}

export function isTwitchDisconnectResponse(message: MessageResponse): message is TwitchDisconnectResponse {
  return message.eventType === 'twitch-disconnect-response';
}

export function isTwitchToggleChatResponse(message: MessageResponse): message is TwitchToggleChatResponse {
  return message.eventType === 'twitch-toggle-chat-response';
}

// General Twitch response type guard
export function isTwitchResponse(message: MessageResponse): message is TwitchConnectResponse | TwitchDisconnectResponse | TwitchToggleChatResponse {
  return isTwitchConnectResponse(message) || isTwitchDisconnectResponse(message) || isTwitchToggleChatResponse(message);
}

// Message builders
export function createTwitchRequest(action: TwitchRequestBody['action'], params?: Omit<TwitchRequestBody, 'action' | 'timestamp'>): TwitchRequest {
  return {
    eventType: 'twitch',
    eventBody: {
      action,
      ...params,
      timestamp: new Date().toISOString()
    }
  };
}

export function createTwitchConnectResponse(success: boolean, connected: boolean, message?: string, error?: string): TwitchConnectResponse {
  return {
    eventType: 'twitch-connect-response',
    eventBody: {
      success,
      connected,
      message,
      error,
      timestamp: new Date().toISOString()
    }
  };
}

export function createTwitchDisconnectResponse(success: boolean, connected: boolean, message?: string, error?: string): TwitchDisconnectResponse {
  return {
    eventType: 'twitch-disconnect-response',
    eventBody: {
      success,
      connected,
      message,
      error,
      timestamp: new Date().toISOString()
    }
  };
}

export function createTwitchToggleChatResponse(success: boolean, chatEnabled: boolean, message?: string, error?: string): TwitchToggleChatResponse {
  return {
    eventType: 'twitch-toggle-chat-response',
    eventBody: {
      success,
      chatEnabled,
      message,
      error,
      timestamp: new Date().toISOString()
    }
  };
}

/* ===== TWITCH AUTH MESSAGES ===== */

export interface TwitchAuthRequestBody {
  action: 'getAuthUrl' | 'exchangeCode' | 'getAuthState' | 'setChannel' | 'logout';
  code?: string;
  channel?: string;
  timestamp: string;
}

export interface TwitchAuthRequest extends BaseMessage<'twitch_auth', TwitchAuthRequestBody> {}

export interface TwitchAuthResponseBody {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  timestamp: string;
}

export interface TwitchAuthResponse extends BaseMessage<'twitch_auth-response', TwitchAuthResponseBody> {}

// Type guards
export function isTwitchAuthRequest(message: MessageRequest): message is TwitchAuthRequest {
  return message.eventType === 'twitch_auth';
}

export function isTwitchAuthResponse(message: MessageResponse): message is TwitchAuthResponse {
  return message.eventType === 'twitch_auth-response';
}

// Message builders
export function createTwitchAuthRequest(action: TwitchAuthRequestBody['action'], params?: Omit<TwitchAuthRequestBody, 'action' | 'timestamp'>): TwitchAuthRequest {
  return {
    eventType: 'twitch_auth',
    eventBody: {
      action,
      ...params,
      timestamp: new Date().toISOString()
    }
  };
}

export function createTwitchAuthResponse(success: boolean, message?: string, error?: string, data?: any): TwitchAuthResponse {
  return {
    eventType: 'twitch_auth-response',
    eventBody: {
      success,
      message,
      error,
      data,
      timestamp: new Date().toISOString()
    }
  };
}

/* ===== TWITCH AUTH STATE MESSAGES ===== */

export interface TwitchAuthStateResponseBody {
  authState: any;
  timestamp: string;
}

export interface TwitchAuthStateResponse extends BaseMessage<'twitch_auth_state', TwitchAuthStateResponseBody> {}

// Message builders
export function createTwitchAuthStateResponse(authState: any): TwitchAuthStateResponse {
  return {
    eventType: 'twitch_auth_state',
    eventBody: {
      authState,
      timestamp: new Date().toISOString()
    }
  };
}

/* ===== TWITCH CHAT MESSAGES ===== */

export interface TwitchUserState {
  'badge-info': string | null;
  badges: Record<string, string> | null;
  'client-nonce': string;
  color: string;
  'display-name': string;
  emotes: any | null;
  'first-msg': boolean;
  flags: any | null;
  id: string;
  mod: boolean;
  'returning-chatter': boolean;
  'room-id': string;
  subscriber: boolean;
  'tmi-sent-ts': string;
  turbo: boolean;
  'user-id': string;
  'user-type': string | null;
  'emotes-raw': string | null;
  'badge-info-raw': string | null;
  'badges-raw': string | null;
  username: string;
  'message-type': string;
}

export interface TwitchChatMessageData {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: string;
  userState: TwitchUserState;
}

export interface TwitchChatMessage {
  type: 'twitch_chat_message';
  data: TwitchChatMessageData;
}

// Type guards
export function isTwitchChatMessage(message: any): message is TwitchChatMessage {
  return message && message.type === 'twitch_chat_message' && message.data;
}

// Message builders
export function createTwitchChatMessage(data: TwitchChatMessageData): TwitchChatMessage {
  return {
    type: 'twitch_chat_message',
    data
  };
}

// ===== TWITCH EVENT TYPES =====

export interface TwitchSubscriptionEventData {
  id: string;
  username: string;
  displayName: string;
  type: 'new' | 'resub' | 'gift';
  months?: number;
  message?: string;
  timestamp: string;
  isGift?: boolean;
  recipientUsername?: string;
}

export interface TwitchSubscriptionEvent {
  type: 'twitch_subscription';
  data: TwitchSubscriptionEventData;
}

export interface TwitchBitsEventData {
  id: string;
  username: string;
  displayName: string;
  bits: number;
  message?: string;
  timestamp: string;
}

export interface TwitchBitsEvent {
  type: 'twitch_bits';
  data: TwitchBitsEventData;
}

export interface TwitchFollowEventData {
  id: string;
  username: string;
  displayName: string;
  timestamp: string;
}

export interface TwitchFollowEvent {
  type: 'twitch_follow';
  data: TwitchFollowEventData;
}

export interface TwitchRaidEventData {
  id: string;
  username: string;
  displayName: string;
  viewers: number;
  timestamp: string;
}

export interface TwitchRaidEvent {
  type: 'twitch_raid';
  data: TwitchRaidEventData;
}

export interface TwitchHostEventData {
  id: string;
  username: string;
  displayName: string;
  viewers: number;
  timestamp: string;
}

export interface TwitchHostEvent {
  type: 'twitch_host';
  data: TwitchHostEventData;
}

// Union type for all Twitch events
export type TwitchEvent = TwitchChatMessage | TwitchSubscriptionEvent | TwitchBitsEvent | TwitchFollowEvent | TwitchRaidEvent | TwitchHostEvent;

// Type guards for Twitch events
export function isTwitchSubscriptionEvent(message: any): message is TwitchSubscriptionEvent {
  return message.type === 'twitch_subscription';
}

export function isTwitchBitsEvent(message: any): message is TwitchBitsEvent {
  return message.type === 'twitch_bits';
}

export function isTwitchFollowEvent(message: any): message is TwitchFollowEvent {
  return message.type === 'twitch_follow';
}

export function isTwitchRaidEvent(message: any): message is TwitchRaidEvent {
  return message.type === 'twitch_raid';
}

export function isTwitchHostEvent(message: any): message is TwitchHostEvent {
  return message.type === 'twitch_host';
}

// Helper functions to create Twitch events
export function createTwitchSubscriptionEvent(data: TwitchSubscriptionEventData): TwitchSubscriptionEvent {
  return {
    type: 'twitch_subscription',
    data
  };
}

export function createTwitchBitsEvent(data: TwitchBitsEventData): TwitchBitsEvent {
  return {
    type: 'twitch_bits',
    data
  };
}

export function createTwitchFollowEvent(data: TwitchFollowEventData): TwitchFollowEvent {
  return {
    type: 'twitch_follow',
    data
  };
}

export function createTwitchRaidEvent(data: TwitchRaidEventData): TwitchRaidEvent {
  return {
    type: 'twitch_raid',
    data
  };
}

export function createTwitchHostEvent(data: TwitchHostEventData): TwitchHostEvent {
  return {
    type: 'twitch_host',
    data
  };
}