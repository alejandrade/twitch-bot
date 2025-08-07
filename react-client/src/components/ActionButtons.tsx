import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Send, Wifi, LiveTv } from '@mui/icons-material';

interface ActionButtonsProps {
  isConnected: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  onSendHello: () => void;
  onSendPing: () => void;
  onToggleStream: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  isConnected, 
  isLoading, 
  isStreaming,
  onSendHello, 
  onSendPing,
  onToggleStream
}) => {
  const buttonDisabled = !isConnected || isLoading;

  console.log('ActionButtons render:', { isConnected, isLoading, isStreaming });
  
  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={onSendHello}
        disabled={buttonDisabled}
        startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Send />}
        sx={{ minWidth: 140 }}
      >
        {isLoading ? 'Sending...' : 'Send Hello'}
      </Button>
      
      <Button
        variant="contained"
        color="secondary"
        onClick={onSendPing}
        disabled={buttonDisabled}
        startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Wifi />}
        sx={{ minWidth: 140 }}
      >
        {isLoading ? 'Sending...' : 'Send Ping'}
      </Button>
      
      <Button
        variant="contained"
        color={isStreaming ? "error" : "success"}
        onClick={onToggleStream}
        disabled={buttonDisabled}
        startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <LiveTv />}
        sx={{ minWidth: 140 }}
      >
        {isLoading ? 'Toggling...' : (isStreaming ? 'Stop Stream' : 'Start Stream')}
      </Button>
    </Box>
  );
};