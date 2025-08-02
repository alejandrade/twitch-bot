import { WebSocketServer, WebSocket } from 'ws';
import { MessageHandlerRegistry, HelloHandler, PingHandler } from './handlers';

const PORT = 8080;

// Create message handler registry and register handlers
const messageRegistry = new MessageHandlerRegistry();
messageRegistry.register(new HelloHandler());
messageRegistry.register(new PingHandler());

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);
console.log(`Registered event types: ${messageRegistry.getRegisteredEventTypes().join(', ')}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  ws.on('message', (data: Buffer) => {
    const rawMessage = data.toString().trim();
    console.log(`Received raw message: ${rawMessage}`);

    // Process message through handler registry
    const response = messageRegistry.processRawMessage(rawMessage, ws);
    
    const responseJson = JSON.stringify(response);
    ws.send(responseJson);
    console.log(`Sent response:`, response);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('\nShutting down WebSocket server...');
  
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