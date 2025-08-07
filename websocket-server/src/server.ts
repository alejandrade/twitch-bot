import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { MessageHandlerRegistry, HelloHandler, PingHandler, ToggleStreamHandler, TwitchHandler, TwitchAuthHandler } from './handlers';
import { OBSService } from './services/OBSService';
import { WebSocketManager } from './services/WebSocketManager';
import { EventService } from './services/EventService';

// Try loading root-level .env so values are available even when running within websocket-server directory
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: false });
}

const PORT = 8080;

// Check if OBS integration is enabled
const OBS_INTEGRATION_ENABLED = process.env.OBS_INTEGRATION_ENABLED !== 'false';

// Create message handler registry and register handlers
const obsService = OBSService.instance;
const messageRegistry = new MessageHandlerRegistry();
messageRegistry.register(new HelloHandler());
messageRegistry.register(new PingHandler());
messageRegistry.register(new ToggleStreamHandler());
messageRegistry.register(new TwitchHandler());
messageRegistry.register(new TwitchAuthHandler());

console.log(`OBS Integration: ${OBS_INTEGRATION_ENABLED ? 'ENABLED' : 'DISABLED'}`);

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);
console.log(`Registered event types: ${messageRegistry.getRegisteredEventTypes().join(', ')}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');
  
  // Add connection to manager
  const wsManager = WebSocketManager.instance;
  wsManager.addConnection(ws);

  // Send initial OBS state (only if OBS integration is enabled)
  if (OBS_INTEGRATION_ENABLED) {
    (async () => {
      try {
        await obsService.connect();
        const streaming = await obsService.isStreaming();
        EventService.instance.sendInitialObsState(streaming, ws);
      } catch (err) {
        console.error('Failed to connect to OBS:', err);
      }
    })();
  } else {
    // Send disabled state when OBS integration is disabled
    EventService.instance.sendInitialObsState(false, ws);
  }

  ws.on('message', async (data: Buffer) => {
    const rawMessage = data.toString().trim();
    console.log(`Received raw message: ${rawMessage}`);

    // Process message through handler registry
    const response = await messageRegistry.processRawMessage(rawMessage, ws);
    
    const responseJson = JSON.stringify(response);
    ws.send(responseJson);
    console.log(`Sent response:`, response);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    wsManager.removeConnection(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsManager.removeConnection(ws);
  });
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('\nShutting down WebSocket server...');
  if (OBS_INTEGRATION_ENABLED) {
    obsService.disconnect();
  }
  // Force exit after 2 seconds if graceful shutdown fails
  const forceExit = setTimeout(() => {
    console.log('Force closing WebSocket server');
    process.exit(1);
  }, 2000);
  
  wss.close(() => {
    console.log('WebSocket server closed');
    clearTimeout(forceExit);
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);