import React, { useState, useRef } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { soundEffectService } from '../services/SoundEffectService';

interface SoundEffectButtonProps {
  soundName: string;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const SoundEffectButton: React.FC<SoundEffectButtonProps> = ({
  soundName,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  disabled = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlaySound = async () => {
    if (!soundEffectService.hasSound(soundName)) {
      setError(`Sound effect "${soundName}" not found`);
      return;
    }

    try {
      if (isPlaying) {
        // Stop the current sound
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
          currentAudioRef.current = null;
        }
        setIsPlaying(false);
        setError(null);
        return;
      }

      setIsPlaying(true);
      setError(null);
      
      // Get the sound and play it, keeping a reference to stop it
      const sound = soundEffectService.getSound(soundName);
      if (sound) {
        const audioClone = sound.audio.cloneNode() as HTMLAudioElement;
        currentAudioRef.current = audioClone;
        
        // Add event listener to reset state when sound ends
        audioClone.addEventListener('ended', () => {
          setIsPlaying(false);
          currentAudioRef.current = null;
        });
        
        audioClone.play().catch(error => {
          console.error(`Failed to play sound ${soundName}:`, error);
          setIsPlaying(false);
          currentAudioRef.current = null;
        });
      }
    } catch (error) {
      setError(`Failed to play sound: ${error}`);
      setIsPlaying(false);
      currentAudioRef.current = null;
    }
  };

  return (
    <Box>
      <Button
        variant={isPlaying ? "contained" : variant}
        color={isPlaying ? "error" : color}
        size={size}
        disabled={disabled}
        onClick={handlePlaySound}
        sx={{ minWidth: 120 }}
      >
        {isPlaying ? '⏹ Stop' : soundName}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 1, fontSize: '0.75rem' }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

interface SoundEffectPanelProps {
  soundNames: string[];
  title?: string;
  compact?: boolean;
}

export const SoundEffectPanel: React.FC<SoundEffectPanelProps> = ({
  soundNames,
  title = 'Sound Effects',
  compact = false
}) => {
  if (compact) {
    return (
      <Box sx={{ width: '100%' }}>
        {soundNames.map((soundName) => (
          <SoundEffectButton
            key={soundName}
            soundName={soundName}
            variant="outlined"
            size="small"
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {soundNames.map((soundName) => (
          <SoundEffectButton
            key={soundName}
            soundName={soundName}
            variant="outlined"
            size="small"
          />
        ))}
      </Box>
    </Box>
  );
};
