import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageRequest, 
  MessageResponse, 
  isObsStateResponse, 
  TwitchChatMessage,
  isTwitchConnectResponse,
  isTwitchDisconnectResponse,
  isTwitchToggleChatResponse,
  isTwitchAuthResponse
} from '@websocket-demo/shared-types';

interface UseWebSocketReturn {
  isConnected: boolean;
  isLoading: boolean;
  lastMessage: MessageResponse | null;
  error: string | null;
  isStreaming: boolean;
  authState: any | null;
  sendMessage: (message: MessageRequest) => void;
  connect: () => void;
  disconnect: () => void;
  onTwitchChatMessage: (callback: (message: TwitchChatMessage) => void) => void;
  onObsStateChange: (callback: (streaming: boolean) => void) => void;
  onTwitchConnectResponse: (callback: (response: any) => void) => void;
  onTwitchDisconnectResponse: (callback: (response: any) => void) => void;
  onTwitchToggleChatResponse: (callback: (response: any) => void) => void;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<MessageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [authState, setAuthState] = useState<any | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Event handlers for different message types
  const chatMessageCallbackRef = useRef<((message: TwitchChatMessage) => void) | null>(null);
  const obsStateCallbackRef = useRef<((streaming: boolean) => void) | null>(null);
  const twitchConnectCallbackRef = useRef<((response: any) => void) | null>(null);
  const twitchDisconnectCallbackRef = useRef<((response: any) => void) | null>(null);
  const twitchToggleChatCallbackRef = useRef<((response: any) => void) | null>(null);

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
        const response = JSON.parse(event.data);
        console.log('Parsed response:', response);
        setLastMessage(response);
        setIsLoading(false);
        
        // Handle different message types with their respective callbacks
        if (isObsStateResponse(response)) {
          const streaming = response.eventBody.streaming;
          setIsStreaming(streaming);
          if (obsStateCallbackRef.current) {
            console.log('Calling OBS state callback');
            obsStateCallbackRef.current(streaming);
          }
        } else if (isTwitchConnectResponse(response)) {
          if (twitchConnectCallbackRef.current) {
            console.log('Calling Twitch connect response callback');
            twitchConnectCallbackRef.current(response);
          }
        } else if (isTwitchDisconnectResponse(response)) {
          if (twitchDisconnectCallbackRef.current) {
            console.log('Calling Twitch disconnect response callback');
            twitchDisconnectCallbackRef.current(response);
          }
        } else if (isTwitchToggleChatResponse(response)) {
          if (twitchToggleChatCallbackRef.current) {
            console.log('Calling Twitch toggle chat response callback');
            twitchToggleChatCallbackRef.current(response);
          }
        } else if (response.type === 'twitch_chat_message') {
          console.log('Valid Twitch chat message:', response);
          if (chatMessageCallbackRef.current) {
            console.log('Calling registered chat message callback');
            chatMessageCallbackRef.current(response);
          } else {
            console.log('No chat message callback registered');
          }
        } else if (isTwitchAuthResponse(response)) {
          console.log('Processing Twitch auth response:', response);
          if (response.eventBody?.success && response.eventBody?.data?.authState) {
            setAuthState(response.eventBody.data.authState);
          }
        } else if (response.eventType === 'twitch_auth_state') {
          console.log('Processing Twitch auth state response:', response);
          if (response.eventBody?.authState) {
            setAuthState(response.eventBody.authState);
          }
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

  // Event handler registration methods
  const onTwitchChatMessage = useCallback((callback: (message: TwitchChatMessage) => void) => {
    console.log('Registering Twitch chat message callback');
    chatMessageCallbackRef.current = callback;
  }, []);

  const onObsStateChange = useCallback((callback: (streaming: boolean) => void) => {
    console.log('Registering OBS state change callback');
    obsStateCallbackRef.current = callback;
  }, []);

  const onTwitchConnectResponse = useCallback((callback: (response: any) => void) => {
    console.log('Registering Twitch connect response callback');
    twitchConnectCallbackRef.current = callback;
  }, []);

  const onTwitchDisconnectResponse = useCallback((callback: (response: any) => void) => {
    console.log('Registering Twitch disconnect response callback');
    twitchDisconnectCallbackRef.current = callback;
  }, []);

  const onTwitchToggleChatResponse = useCallback((callback: (response: any) => void) => {
    console.log('Registering Twitch toggle chat response callback');
    twitchToggleChatCallbackRef.current = callback;
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
    isStreaming,
    authState,
    sendMessage,
    connect,
    disconnect,
    onTwitchChatMessage,
    onObsStateChange,
    onTwitchConnectResponse,
    onTwitchDisconnectResponse,
    onTwitchToggleChatResponse
  };
};