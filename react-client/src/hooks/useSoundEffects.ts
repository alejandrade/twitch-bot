import { useState, useEffect, useCallback } from 'react';
import { soundEffectService } from '../services/SoundEffectService';

export const useSoundEffects = (soundFiles: string[] = []) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedSounds, setLoadedSounds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load sound effects on mount - only run once
  useEffect(() => {
    const loadSounds = async () => {
      if (soundFiles.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        await soundEffectService.loadSounds(soundFiles);
        const loadedNames = soundEffectService.getSoundNames();
        setLoadedSounds(loadedNames);
        console.log('Sound effects loaded successfully:', loadedNames);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to load sound effects: ${errorMessage}`);
        console.error('Failed to load sound effects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSounds();

    // Cleanup on unmount
    return () => {
      soundEffectService.unloadAll();
    };
  }, [soundFiles]); // Keep the dependency but we'll fix the array issue

  const playSound = (soundName: string) => {
    soundEffectService.playSound(soundName);
  };

  const reloadSounds = async () => {
    setIsLoading(true);
    setError(null);

    try {
      soundEffectService.unloadAll();
      await soundEffectService.loadSounds(soundFiles);
      setLoadedSounds(soundEffectService.getSoundNames());
    } catch (err) {
      setError(`Failed to reload sound effects: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    loadedSounds,
    error,
    playSound,
    reloadSounds,
    hasSound: (name: string) => soundEffectService.hasSound(name)
  };
};
