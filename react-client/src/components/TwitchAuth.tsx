import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  TextField,
  Stack,
  Chip
} from '@mui/material';
import { createTwitchAuthRequest, isTwitchAuthResponse } from '@websocket-demo/shared-types';

interface TwitchAuthProps {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  lastMessage: any;
}

export const TwitchAuth: React.FC<TwitchAuthProps> = ({
  isConnected,
  sendMessage,
  lastMessage
}) => {
  const [authState, setAuthState] = useState<any>(null);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [channel, setChannel] = useState<string>('');
  const [status, setStatus] = useState<any>(null);

  // Handle Twitch auth responses
  useEffect(() => {
    if (lastMessage && isTwitchAuthResponse(lastMessage)) {
      if (lastMessage.eventBody.success) {
        setStatus({ type: 'success', message: lastMessage.eventBody.message });
        
        if (lastMessage.eventBody.data) {
          if (lastMessage.eventBody.data.authUrl) {
            setAuthUrl(lastMessage.eventBody.data.authUrl);
            // Automatically redirect to the auth URL when we receive it
            window.location.href = lastMessage.eventBody.data.authUrl;
          }
          if (lastMessage.eventBody.data.authState) {
            setAuthState(lastMessage.eventBody.data.authState);
            // If we're on the auth screen and get authenticated, redirect to dashboard
            if (window.location.pathname === '/') {
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1000);
            }
          }
        }
      } else {
        setStatus({ type: 'error', message: lastMessage.eventBody.error });
      }
    }
  }, [lastMessage]);

  const handleGetAuthUrl = () => {
    const authMessage = createTwitchAuthRequest('getAuthUrl');
    sendMessage(authMessage);
  };

  const handleGetAuthState = () => {
    const authMessage = createTwitchAuthRequest('getAuthState');
    sendMessage(authMessage);
  };

  const handleSetChannel = () => {
    if (!channel.trim()) {
      setStatus({ type: 'error', message: 'Channel name is required' });
      return;
    }
    const authMessage = createTwitchAuthRequest('setChannel', { channel });
    sendMessage(authMessage);
    setChannel('');
  };

  const handleLogout = () => {
    const authMessage = createTwitchAuthRequest('logout');
    sendMessage(authMessage);
    setAuthState(null);
  };

  const handleStartAuth = () => {
    // Always get the auth URL first, then redirect when we receive it
    handleGetAuthUrl();
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Twitch Authentication
        </Typography>

        {status && (
          <Alert severity={status.type} sx={{ mb: 2 }}>
            {status.message}
          </Alert>
        )}

        {authState && authState.isAuthenticated ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Authenticated as: <Chip label={authState.username} color="primary" />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Channel: {authState.channel || 'Not set'}
              </Typography>
            </Box>

            <Box>
              <TextField
                label="Channel Name"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                size="small"
                sx={{ mr: 1, width: 200 }}
                placeholder="Enter channel name"
              />
              <Button
                variant="contained"
                onClick={handleSetChannel}
                disabled={!isConnected}
              >
                Set Channel
              </Button>
            </Box>

            <Box>
              <Button
                variant="outlined"
                onClick={handleGetAuthState}
                disabled={!isConnected}
                sx={{ mr: 1 }}
              >
                Refresh Auth State
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleLogout}
                disabled={!isConnected}
              >
                Logout
              </Button>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Click the button below to authenticate with Twitch. You'll be redirected to Twitch to authorize, then automatically returned to this app.
            </Typography>

            <Button
              variant="contained"
              onClick={handleStartAuth}
              disabled={!isConnected}
              size="large"
            >
              Authenticate with Twitch
            </Button>

            
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}; 