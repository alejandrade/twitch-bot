import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Message } from '@mui/icons-material';

interface ServerResponseProps {
  response: string;
}

export const ServerResponse: React.FC<ServerResponseProps> = ({ response }) => {
  if (!response) return null;

  return (
    <Card sx={{ mt: 3, backgroundColor: 'background.default' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Message sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h3" component="h3">
            Server Response:
          </Typography>
        </Box>
        <Typography 
          variant="body1" 
          sx={{ 
            fontSize: '18px',
            color: 'success.main',
            fontWeight: 'bold',
            mt: 1
          }}
        >
          {response}
        </Typography>
      </CardContent>
    </Card>
  );
};