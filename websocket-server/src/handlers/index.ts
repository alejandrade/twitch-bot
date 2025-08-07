// Export all handlers and registry for clean imports
export { MessageHandler } from './MessageHandler';
export { MessageHandlerRegistry } from './MessageHandlerRegistry';
export { HelloHandler } from './HelloHandler';
export { PingHandler } from './PingHandler';
export { ToggleStreamHandler } from './ToggleStreamHandler';
export { TwitchHandler } from './TwitchHandler';
export { TwitchAuthHandler } from './TwitchAuthHandler';

// Re-export shared types for convenience
export * from '@websocket-demo/shared-types';