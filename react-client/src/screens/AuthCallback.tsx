import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Typography } from '@mui/material';
import { createTwitchAuthRequest } from '@websocket-demo/shared-types';

export const AuthCallback: React.FC = () => {
  const location = useLocation();
  const [status, setStatus] = useState<string>('Processing authorization...');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      setStatus(`Authorization failed: ${error}`);
      return;
    }

    if (code) {
      // Send the code to the WebSocket server
      const ws = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080');
      
      ws.onopen = () => {
        console.log('WebSocket connected, sending auth code...');
        const authMessage = createTwitchAuthRequest('exchangeCode', { code });
        console.log('Sending auth message:', authMessage);
        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          console.log('Auth callback received response:', response);
          console.log('Response eventType:', response.eventType);
          
          // Only process twitch_auth-response messages
          if (response.eventType === 'twitch_auth-response') {
            console.log('Response eventBody:', response.eventBody);
            console.log('Response success:', response.eventBody?.success);
            
            if (response.eventBody?.success === true) {
              setStatus('Authorization successful! Redirecting to dashboard...');
              // Redirect to dashboard immediately
              window.location.href = '/dashboard';
            } else {
              const errorMessage = response.eventBody?.error || 'Unknown error';
              console.log('Auth failed, error:', errorMessage);
              setStatus(`Authorization failed: ${errorMessage}`);
            }
            ws.close();
          } else {
            console.log('Ignoring non-twitch_auth response:', response.eventType);
            // Don't close the connection, wait for the correct response
          }
        } catch (error) {
          console.error('Error parsing response:', error);
          setStatus('Error processing server response');
          ws.close();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('Failed to connect to server');
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
    } else {
      setStatus('No authorization code found in URL');
    }
  }, [location]);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Twitch Authorization
      </Typography>
      <Typography variant="body1">
        {status}
      </Typography>
    </Container>
  );
}; 