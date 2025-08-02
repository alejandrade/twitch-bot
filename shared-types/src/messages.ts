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
export type MessageRequest = HelloRequest | PingRequest;

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
export type MessageResponse = HelloResponse | PongResponse | ErrorResponse;

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