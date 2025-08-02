import React, { useState, useEffect } from 'react';
import { 
  createHelloRequest, 
  createPingRequest,
  isHelloResponse,
  isPongResponse,
  isErrorResponse
} from '@websocket-demo/shared-types';
import { useWebSocket } from './hooks';

const App: React.FC = () => {
  const [response, setResponse] = useState<string>('');
  const { 
    isConnected, 
    isLoading, 
    lastMessage, 
    error, 
    sendMessage 
  } = useWebSocket('ws://localhost:8080');

  // Handle new messages with type guards
  useEffect(() => {
    if (lastMessage) {
      if (isHelloResponse(lastMessage)) {
        setResponse(`Hello Response: ${lastMessage.eventBody.message}`);
      } else if (isPongResponse(lastMessage)) {
        setResponse(`Pong Response: ${lastMessage.eventBody.message}`);
      } else if (isErrorResponse(lastMessage)) {
        setResponse(`Error: ${lastMessage.eventBody.message}`);
      }
    }
  }, [lastMessage]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setResponse(`Connection Error: ${error}`);
    }
  }, [error]);

  const sendHello = () => {
    setResponse(''); // Clear previous response
    const helloMessage = createHelloRequest('Hello from React client!');
    sendMessage(helloMessage);
  };

  const sendPing = () => {
    setResponse(''); // Clear previous response
    const pingMessage = createPingRequest('Ping from React client!');
    sendMessage(pingMessage);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>WebSocket React Client</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>
          Connection Status: 
          <span style={{ 
            color: isConnected ? 'green' : 'red',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={sendHello}
          disabled={!isConnected || isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isConnected && !isLoading ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected && !isLoading ? 'pointer' : 'not-allowed',
            opacity: isLoading ? 0.7 : 1,
            marginRight: '10px'
          }}
        >
          {isLoading ? 'Sending...' : 'Send Hello'}
        </button>
        
        <button 
          onClick={sendPing}
          disabled={!isConnected || isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isConnected && !isLoading ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected && !isLoading ? 'pointer' : 'not-allowed',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Sending...' : 'Send Ping'}
        </button>
      </div>

      {response && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <h3>Server Response:</h3>
          <p style={{ 
            fontSize: '18px',
            color: '#28a745',
            fontWeight: 'bold',
            margin: '10px 0 0 0'
          }}>
            {response}
          </p>
        </div>
      )}

      {!isConnected && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24'
        }}>
          <p><strong>Note:</strong> Make sure the WebSocket server is running on port 8080.</p>
          <p>To start the server, run: <code>cd websocket-server && npm run dev</code></p>
          {error && <p><strong>Error:</strong> {error}</p>}
        </div>
      )}
    </div>
  );
};

export default App;