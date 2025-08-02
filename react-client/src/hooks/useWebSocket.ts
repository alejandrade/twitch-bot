import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageRequest, MessageResponse } from '@websocket-demo/shared-types';

interface UseWebSocketReturn {
  isConnected: boolean;
  isLoading: boolean;
  lastMessage: MessageResponse | null;
  error: string | null;
  sendMessage: (message: MessageRequest) => void;
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<MessageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        console.log('Received raw:', event.data);
        try {
          const response: MessageResponse = JSON.parse(event.data);
          console.log('Parsed response:', response);
          setLastMessage(response);
          setIsLoading(false);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          setError(`Parse Error: ${event.data}`);
          setIsLoading(false);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Disconnected from WebSocket server');
        setIsConnected(false);
        setIsLoading(false);
      };

      wsRef.current.onerror = (wsError) => {
        console.error('WebSocket error:', wsError);
        setError('WebSocket connection error');
        setIsConnected(false);
        setIsLoading(false);
      };
    } catch (connectionError) {
      console.error('Failed to connect:', connectionError);
      setError('Failed to establish WebSocket connection');
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  const sendMessage = useCallback((message: MessageRequest) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      setError(null);
      
      wsRef.current.send(JSON.stringify(message));
      console.log('Sent message:', message);
    } else {
      setError('WebSocket is not connected. Please make sure the server is running.');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isLoading,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect
  };
};