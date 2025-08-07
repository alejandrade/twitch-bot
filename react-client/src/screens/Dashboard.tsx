import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import { Wifi, WifiOff, LiveTv, Videocam, VideocamOff } from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';
import { ChatDisplay, SoundEffectPanel } from '../components';
import { ollamaService } from '../services/OllamaService';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isModerator?: boolean;
  isSubscriber?: boolean;
  badges?: string[];
}

export const Dashboard: React.FC = () => {
  const [chatEnabled, setChatEnabled] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [twitchConnected, setTwitchConnected] = useState(false);
  
  // Sound effects - you can add your sound files here
  const soundFiles = React.useMemo(() => [
    'my-leg.mp3',
    'dry-fart.mp3',
    'uncle-ruckus.mp3',
    'vine-dramatic-boom-sound-effect.mp3',
    'mario-1up.mp3',
    'wow.mp3'
  ], []);
  
  const { loadedSounds, isLoading: soundsLoading, error: soundsError } = useSoundEffects(soundFiles);
  
  // Use a ref to track the current chatEnabled state
  const chatEnabledRef = useRef(chatEnabled);
  
  // Update the ref whenever chatEnabled changes
  useEffect(() => {
    chatEnabledRef.current = chatEnabled;
  }, [chatEnabled]);

  const {
    isConnected,
    isLoading,
    lastMessage,
    error,
    isStreaming,
    authState,
    sendMessage,
    onTwitchChatMessage,
    onTwitchConnectResponse,
    onTwitchDisconnectResponse,
    onTwitchToggleChatResponse
  } = useWebSocket(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080');

  // Request auth state when component mounts
  useEffect(() => {
    if (isConnected) {
      const authStateMessage = {
        eventType: 'twitch_auth' as const,
        eventBody: {
          action: 'getAuthState' as const,
          timestamp: new Date().toISOString()
        }
      };
      sendMessage(authStateMessage);
    }
  }, [isConnected, sendMessage]);

  // Register the chat message callback once when component mounts
  useEffect(() => {
    onTwitchChatMessage(async (chatMessage) => {
      console.log('Dashboard received chat message:', chatMessage);
      
      // Use the ref to get the current chatEnabled state
      if (chatEnabledRef.current) {
        console.log('Processing chat message in callback');
        const chatData = chatMessage.data;

        if (chatData) {
          console.log('Chat data:', chatData);
          const newMessage: ChatMessage = {
            id: chatData.id,
            username: chatData.username,
            message: chatData.message,
            timestamp: new Date(chatData.timestamp),
            isModerator: chatData.userState?.mod || false,
            isSubscriber: chatData.userState?.subscriber || false,
            badges: chatData.userState?.badges ?
              Object.keys(chatData.userState.badges) : []
          };

          console.log('Adding new message to chat:', newMessage);
          setChatMessages(prev => [...prev, newMessage]);

          console.log('Auth state:', authState);
          console.log('Bot username:', authState?.username);
          console.log('Message:', chatData.message);
          console.log('Message includes username:', authState?.username ? chatData.message.toLowerCase().includes(authState.username.toLowerCase()) : false);
          
          // Check if someone mentioned the bot's username
          if (authState?.username && chatData.message.toLowerCase().includes(authState.username.toLowerCase())) {
            console.log(`Bot mentioned by ${chatData.username}! Generating response...`);
            
            try {
              // Check if Ollama is available first
              const isOllamaAvailable = await ollamaService.healthCheck();
              if (!isOllamaAvailable) {
                console.warn('Ollama is not available, skipping response generation');
                return;
              }

                             // Generate response using Ollama
               const response = await ollamaService.generate({
                 prompt: `You are Marvin the Paranoid Android from Hitchhiker's Guide to the Galaxy. You are depressed, pessimistic, and sarcastic. A user named "${chatData.username}" just said: "${chatData.message}". They mentioned your username "${authState.username}". Respond like Marvin - depressed, sarcastic, and utterly pessimistic about everything. Be witty but deeply cynical. Express how meaningless and pointless everything is, especially this conversation. Keep your response under 200 characters.`
               });

              if (response.response) {
                console.log('Generated response:', response.response);
                
                // Send the response to chat
                handleSendMessage(response.response);
              }
            } catch (error) {
              console.error('Failed to generate response:', error);
              // Send a fallback response if Ollama fails
              handleSendMessage(`Hey ${chatData.username}! Thanks for the mention! 👋`);
            }
          }
        }
      } else {
        console.log('Chat is not enabled, ignoring message');
      }
    });
  }, [onTwitchChatMessage, authState]); // Depend on authState to access username

  // Debug auth state changes
  useEffect(() => {
    console.log('Auth state changed:', authState);
  }, [authState]);

  // Register the Twitch connect response callback once when component mounts
  useEffect(() => {
    onTwitchConnectResponse((response) => {
      console.log('Processing twitch connect response:', response);
      if (response.eventBody?.success === true) {
        console.log('Setting twitchConnected to true');
        setTwitchConnected(true);
      }
    });
  }, [onTwitchConnectResponse]);

  // Register the Twitch disconnect response callback once when component mounts
  useEffect(() => {
    onTwitchDisconnectResponse((response) => {
      console.log('Processing twitch disconnect response:', response);
      if (response.eventBody?.success === true) {
        console.log('Setting twitchConnected to false');
        setTwitchConnected(false);
        setChatEnabled(false);
      }
    });
  }, [onTwitchDisconnectResponse]);

  // Register the Twitch toggle chat response callback once when component mounts
  useEffect(() => {
    onTwitchToggleChatResponse((response) => {
      console.log('Processing twitch toggle chat response:', response);
      if (response.eventBody?.success === true) {
        const chatEnabled = response.eventBody?.chatEnabled;
        console.log('Chat processing state:', chatEnabled);
        setChatEnabled(chatEnabled);
      }
    });
  }, [onTwitchToggleChatResponse]);

  const handleBanUser = (username: string) => {
    const banMessage = {
      eventType: 'twitch' as const,
      eventBody: {
        action: 'banUser' as const,
        username,
        reason: 'Violation of community guidelines',
        timestamp: new Date().toISOString()
      }
    };
    sendMessage(banMessage);
  };

  const handleKickUser = (username: string) => {
    const kickMessage = {
      eventType: 'twitch' as const,
      eventBody: {
        action: 'kickUser' as const,
        username,
        reason: 'Temporary removal',
        timestamp: new Date().toISOString()
      }
    };
    sendMessage(kickMessage);
  };

  const handleTimeoutUser = (username: string) => {
    const timeoutMessage = {
      eventType: 'twitch' as const,
      eventBody: {
        action: 'kickUser' as const, // Using kickUser for timeout
        username,
        reason: 'Timeout',
        timestamp: new Date().toISOString()
      }
    };
    sendMessage(timeoutMessage);
  };

  const handleSendMessage = (message: string) => {
    const sendMessageRequest = {
      eventType: 'twitch' as const,
      eventBody: {
        action: 'sendMessage' as const,
        message,
        timestamp: new Date().toISOString()
      }
    };
    sendMessage(sendMessageRequest);

    // Add the sent message to chat immediately
    const sentMessage: ChatMessage = {
      id: `sent-${Date.now()}`,
      username: 'You',
      message,
      timestamp: new Date(),
      isModerator: false,
      isSubscriber: false,
      badges: []
    };
    setChatMessages(prev => [...prev, sentMessage]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <AppBar position="static" sx={{ backgroundColor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            Twitch Bot Dashboard
          </Typography>
          
          {/* Status Icons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              color={isConnected ? "success" : "error"}
              title={`WebSocket: ${isConnected ? "Connected" : "Disconnected"}`}
            >
              {isConnected ? <Wifi /> : <WifiOff />}
            </IconButton>
            
            <IconButton 
              color={twitchConnected ? "success" : "error"}
              title={`Twitch: ${twitchConnected ? "Connected" : "Disconnected"}`}
            >
              {twitchConnected ? <LiveTv /> : <LiveTv />}
            </IconButton>
            
            <IconButton 
              color={isStreaming ? "success" : "default"}
              title={`OBS: ${isStreaming ? "Streaming" : "Not Streaming"}`}
            >
              {isStreaming ? <Videocam /> : <VideocamOff />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content with Sidebar */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar for Sound Effects */}
        {loadedSounds.length > 0 && (
          <Drawer
            variant="permanent"
            sx={{
              width: 280,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 280,
                boxSizing: 'border-box',
                backgroundColor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
                top: '64px', // Account for AppBar height
                height: 'calc(100vh - 64px)'
              },
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                Sound Effects
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List sx={{ p: 0 }}>
                {loadedSounds.map((soundName) => (
                  <ListItem key={soundName} sx={{ px: 0, py: 0.5 }}>
                    <SoundEffectPanel
                      soundNames={[soundName]}
                      title=""
                      compact={true}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
        )}

        {/* Main Content Area */}
        <Box sx={{ flex: 1, p: 3, backgroundColor: 'background.default' }}>
          {/* Twitch Connection */}
          {!twitchConnected && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'text.primary' }}>
                Twitch Connection
              </Typography>

              <Box sx={{ 
                p: 3, 
                backgroundColor: 'background.paper', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      const connectMessage = {
                        eventType: 'twitch' as const,
                        eventBody: {
                          action: 'connect' as const,
                          timestamp: new Date().toISOString()
                        }
                      };
                      sendMessage(connectMessage);
                    }}
                    disabled={!isConnected}
                  >
                    Connect to Twitch
                  </Button>
                </Box>

                <Typography variant="body1" color="text.secondary">
                  Connect to Twitch to access chat functionality and moderation tools.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Live Chat */}
          {twitchConnected && (
            <Box>
              <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'text.primary' }}>
                Live Chat
              </Typography>

              <Box sx={{ 
                p: 3, 
                backgroundColor: 'background.paper', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant={chatEnabled ? "contained" : "outlined"}
                    color={chatEnabled ? "success" : "primary"}
                    onClick={() => {
                      const newChatEnabled = !chatEnabled;
                      setChatEnabled(newChatEnabled);

                      // Send toggleChat action to server
                      const toggleChatMessage = {
                        eventType: 'twitch' as const,
                        eventBody: {
                          action: 'toggleChat' as const,
                          enabled: newChatEnabled,
                          timestamp: new Date().toISOString()
                        }
                      };
                      sendMessage(toggleChatMessage);
                    }}
                  >
                    {chatEnabled ? "Disable" : "Enable"} Chat Processing
                  </Button>

                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      const disconnectMessage = {
                        eventType: 'twitch' as const,
                        eventBody: {
                          action: 'disconnect' as const,
                          timestamp: new Date().toISOString()
                        }
                      };
                      sendMessage(disconnectMessage);
                    }}
                  >
                    Disconnect from Twitch
                  </Button>
                </Box>

                <ChatDisplay
                  isEnabled={chatEnabled}
                  messages={chatMessages}
                  onBanUser={handleBanUser}
                  onKickUser={handleKickUser}
                  onTimeoutUser={handleTimeoutUser}
                  onSendMessage={handleSendMessage}
                />
              </Box>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Box sx={{ mt: 4 }}>
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'error.dark',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.main'
              }}>
                <Typography variant="h6" color="error.light" gutterBottom>
                  Error
                </Typography>
                <Typography variant="body1" color="error.light">
                  {error}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}; 