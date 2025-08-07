import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  TextField
} from '@mui/material';
import {
  Block as BlockIcon,
  ExitToApp as KickIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isModerator?: boolean;
  isSubscriber?: boolean;
  badges?: string[];
}

interface ChatDisplayProps {
  isEnabled: boolean;
  messages: ChatMessage[];
  onBanUser: (username: string) => void;
  onKickUser: (username: string) => void;
  onTimeoutUser: (username: string, duration: number) => void;
  onSendMessage?: (message: string) => void;
}

export const ChatDisplay: React.FC<ChatDisplayProps> = ({
  isEnabled,
  messages,
  onBanUser,
  onKickUser,
  onTimeoutUser,
  onSendMessage
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [messageInput, setMessageInput] = useState('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Handle scroll events to disable auto-scroll when user scrolls up
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
    setAutoScroll(isAtBottom);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'moderator':
        return 'success';
      case 'subscriber':
        return 'primary';
      case 'vip':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && onSendMessage) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!isEnabled) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Chat processing is disabled. Enable it to see chat messages here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      sx={{ 
        height: 400, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Chat Header */}
      <Box sx={{ 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6">Live Chat</Typography>
        <Chip 
          label={`${messages.length} messages`} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      </Box>

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            No messages yet. Chat will appear here when messages come in.
          </Typography>
        ) : (
          messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                p: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              {/* User Avatar */}
              <Avatar
                sx={{ 
                  width: 32, 
                  height: 32, 
                  fontSize: '0.75rem',
                  bgcolor: message.isModerator ? 'success.main' : 'primary.main'
                }}
              >
                {message.username.charAt(0).toUpperCase()}
              </Avatar>

              {/* Message Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: message.isModerator ? 'bold' : 'normal',
                      color: message.isModerator ? 'success.main' : 'text.primary'
                    }}
                  >
                    {message.username}
                  </Typography>
                  
                  {/* Badges */}
                  {message.badges?.map((badge) => (
                    <Chip
                      key={badge}
                      label={badge}
                      size="small"
                      color={getBadgeColor(badge) as any}
                      variant="outlined"
                    />
                  ))}
                  
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(message.timestamp)}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {message.message}
                </Typography>
              </Box>

              {/* Moderation Actions */}
              <Box sx={{ display: 'flex', gap: 0.5, opacity: 0.7, '&:hover': { opacity: 1 } }}>
                <Tooltip title="Timeout (30s)">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => onTimeoutUser(message.username, 30)}
                  >
                    <WarningIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Kick User">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => onKickUser(message.username)}
                  >
                    <KickIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Ban User">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onBanUser(message.username)}
                  >
                    <BlockIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}
        <div ref={chatEndRef} />
      </Box>

      {/* Message Input */}
      {onSendMessage && (
        <Box sx={{ 
          p: 1, 
          borderTop: 1, 
          borderColor: 'divider',
          display: 'flex',
          gap: 1
        }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isEnabled}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleSendMessage}
            disabled={!isEnabled || !messageInput.trim()}
          >
            Send
          </Button>
        </Box>
      )}
    </Paper>
  );
}; 