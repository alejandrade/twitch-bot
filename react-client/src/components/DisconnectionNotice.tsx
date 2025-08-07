import React from 'react';
import { Alert, AlertTitle, Typography, Box } from '@mui/material';
import { Warning, Code } from '@mui/icons-material';

interface DisconnectionNoticeProps {
  isConnected: boolean;
  error?: string;
}

export const DisconnectionNotice: React.FC<DisconnectionNoticeProps> = ({ 
  isConnected, 
  error 
}) => {
  if (isConnected) return null;

  return (
    <Alert severity="warning" sx={{ mt: 3 }} icon={<Warning />}>
      <AlertTitle>Connection Required</AlertTitle>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Note:</strong> Make sure the WebSocket server is running on port 8080.
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Code sx={{ mr: 1, fontSize: '1rem' }} />
        <Typography variant="body2" component="span">
          To start the server, run: 
        </Typography>
        <Typography 
          variant="body2" 
          component="code" 
          sx={{ 
            ml: 1,
            backgroundColor: 'rgba(0,0,0,0.1)',
            padding: '2px 6px',
            borderRadius: 1,
            fontFamily: 'monospace'
          }}
        >
          cd websocket-server && npm run dev
        </Typography>
      </Box>
      {error && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Error:</strong> {error}
        </Typography>
      )}
    </Alert>
  );
};