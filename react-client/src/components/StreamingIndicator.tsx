import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { LiveTv, Stop } from '@mui/icons-material';

interface StreamingIndicatorProps {
  isStreaming: boolean;
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({ isStreaming }) => {
  console.log('StreamingIndicator render:', { isStreaming });
  
  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body1" component="span">
        Stream Status:
      </Typography>
      <Chip
        icon={isStreaming ? <LiveTv /> : <Stop />}
        label={isStreaming ? 'LIVE' : 'OFFLINE'}
        color={isStreaming ? 'error' : 'default'}
        variant={isStreaming ? 'filled' : 'outlined'}
        sx={{
          fontWeight: 'bold',
          '& .MuiChip-icon': {
            color: isStreaming ? 'white' : 'inherit'
          }
        }}
      />
    </Box>
  );
}; 