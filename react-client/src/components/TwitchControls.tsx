import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Alert,
  Stack
} from '@mui/material';
import { createTwitchRequest, isTwitchResponse } from '@websocket-demo/shared-types';

interface TwitchControlsProps {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  lastMessage: any;
}

export const TwitchControls: React.FC<TwitchControlsProps> = ({
  isConnected,
  sendMessage,
  lastMessage
}) => {
  const [username, setUsername] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [chatEnabled, setChatEnabled] = useState(false);
  const [twitchStatus, setTwitchStatus] = useState<any>(null);

  // Handle Twitch responses
  React.useEffect(() => {
    if (lastMessage && isTwitchResponse(lastMessage)) {
      if (lastMessage.eventBody.success) {
        setTwitchStatus({ type: 'success', message: lastMessage.eventBody.message });
      } else {
        setTwitchStatus({ type: 'error', message: lastMessage.eventBody.error });
      }
    }
  }, [lastMessage]);

  const handleConnect = () => {
    const twitchMessage = createTwitchRequest('connect');
    sendMessage(twitchMessage);
  };

  const handleDisconnect = () => {
    const twitchMessage = createTwitchRequest('disconnect');
    sendMessage(twitchMessage);
  };

  const handleToggleChat = (enabled: boolean) => {
    setChatEnabled(enabled);
    const twitchMessage = createTwitchRequest('toggleChat', { enabled });
    sendMessage(twitchMessage);
  };

  const handleKickUser = () => {
    if (!username.trim()) {
      setTwitchStatus({ type: 'error', message: 'Username is required' });
      return;
    }
    const twitchMessage = createTwitchRequest('kickUser', { username, reason });
    sendMessage(twitchMessage);
    setUsername('');
    setReason('');
  };

  const handleBanUser = () => {
    if (!username.trim()) {
      setTwitchStatus({ type: 'error', message: 'Username is required' });
      return;
    }
    const twitchMessage = createTwitchRequest('banUser', { username, reason });
    sendMessage(twitchMessage);
    setUsername('');
    setReason('');
  };

  const handleUnbanUser = () => {
    if (!username.trim()) {
      setTwitchStatus({ type: 'error', message: 'Username is required' });
      return;
    }
    const twitchMessage = createTwitchRequest('unbanUser', { username });
    sendMessage(twitchMessage);
    setUsername('');
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      setTwitchStatus({ type: 'error', message: 'Message is required' });
      return;
    }
    const twitchMessage = createTwitchRequest('sendMessage', { message });
    sendMessage(twitchMessage);
    setMessage('');
  };

  const handleGetStatus = () => {
    const twitchMessage = createTwitchRequest('getStatus');
    sendMessage(twitchMessage);
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Twitch Bot Controls
        </Typography>

        {twitchStatus && (
          <Alert severity={twitchStatus.type} sx={{ mb: 2 }}>
            {twitchStatus.message}
          </Alert>
        )}

        <Stack spacing={2}>
          <Box>
            <Button
              variant="contained"
              onClick={handleConnect}
              disabled={!isConnected}
              sx={{ mr: 1 }}
            >
              Connect to Twitch
            </Button>
            <Button
              variant="outlined"
              onClick={handleDisconnect}
              disabled={!isConnected}
            >
              Disconnect from Twitch
            </Button>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={chatEnabled}
                onChange={(e) => handleToggleChat(e.target.checked)}
                disabled={!isConnected}
              />
            }
            label="Enable Chat Processing"
          />

          <Box>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="small"
              sx={{ mr: 1, width: 150 }}
            />
            <TextField
              label="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              size="small"
              sx={{ mr: 1, width: 200 }}
            />
          </Box>

          <Box>
            <Button
              variant="contained"
              color="warning"
              onClick={handleKickUser}
              disabled={!isConnected}
              sx={{ mr: 1 }}
            >
              Kick User
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleBanUser}
              disabled={!isConnected}
              sx={{ mr: 1 }}
            >
              Ban User
            </Button>
            <Button
              variant="outlined"
              onClick={handleUnbanUser}
              disabled={!isConnected}
            >
              Unban User
            </Button>
          </Box>

          <Box>
            <TextField
              label="Message to send"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              size="small"
              sx={{ mr: 1, width: 300 }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!isConnected}
            >
              Send Message
            </Button>
          </Box>

          <Button
            variant="outlined"
            onClick={handleGetStatus}
            disabled={!isConnected}
          >
            Get Twitch Status
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}; 