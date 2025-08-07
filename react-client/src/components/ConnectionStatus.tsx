import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body1" component="span">
        Connection Status: 
      </Typography>
      <Chip
        icon={isConnected ? <CheckCircle /> : <Cancel />}
        label={isConnected ? 'Connected' : 'Disconnected'}
        color={isConnected ? 'success' : 'error'}
        sx={{ ml: 2, fontWeight: 'bold' }}
      />
    </Box>
  );
};