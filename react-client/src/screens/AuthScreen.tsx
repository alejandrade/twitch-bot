import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Typography } from '@mui/material';
import { useWebSocket } from '../hooks';
import { theme } from '../theme';
import { ConnectionStatus, TwitchAuth } from '../components';

export const AuthScreen: React.FC = () => {
  const { 
    isConnected, 
    lastMessage, 
    sendMessage 
  } = useWebSocket(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Twitch Bot Setup
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          Welcome! Let's get you connected to Twitch.
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          This app helps you manage your Twitch stream and interact with your chat. 
          First, we need to authenticate with your Twitch account.
        </Typography>
        
        <ConnectionStatus isConnected={isConnected} />
        
        <TwitchAuth
          isConnected={isConnected}
          sendMessage={sendMessage}
          lastMessage={lastMessage}
        />
      </Container>
    </ThemeProvider>
  );
}; 