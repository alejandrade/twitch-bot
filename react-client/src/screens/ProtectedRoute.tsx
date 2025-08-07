import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Typography } from '@mui/material';
import { createTwitchAuthRequest } from '@websocket-demo/shared-types';
import { useWebSocket } from '../hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isConnected, isLoading, sendMessage, lastMessage } = useWebSocket(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080');
  const [authState, setAuthState] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check auth state when component mounts
  useEffect(() => {
    if (isConnected && !authChecked) {
      const authMessage = createTwitchAuthRequest('getAuthState');
      sendMessage(authMessage);
      setAuthChecked(true);
    }
  }, [isConnected, sendMessage, authChecked]);
  
  // Handle auth state response
  useEffect(() => {
    if (lastMessage && lastMessage.eventType === 'twitch_auth-response' && lastMessage.eventBody?.data?.authState) {
      setAuthState(lastMessage.eventBody.data.authState);
    }
  }, [lastMessage]);
  
  // Show loading while connecting
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Connecting to server...
        </Typography>
      </Container>
    );
  }
  
  // Show loading while checking auth
  if (isConnected && authChecked && !authState) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Checking authentication...
        </Typography>
      </Container>
    );
  }
  
  // Redirect to auth if not authenticated
  if (authChecked && (!isConnected || (authState && !authState.isAuthenticated))) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}; 