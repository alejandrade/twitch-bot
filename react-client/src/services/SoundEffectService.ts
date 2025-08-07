export interface SoundEffect {
  name: string;
  file: string;
  audio: HTMLAudioElement;
}

export class SoundEffectService {
  private sounds: Map<string, SoundEffect> = new Map();
  private soundDirectory: string;

  constructor(soundDirectory: string = '/sounds') {
    this.soundDirectory = soundDirectory;
  }

  /**
   * Load a sound effect from a file
   */
  async loadSound(name: string, filename: string): Promise<void> {
    try {
      const audioUrl = `${this.soundDirectory}/${filename}`;
      console.log(`Creating audio element for: ${audioUrl}`);
      
      const audio = new Audio(audioUrl);
      
      // Simple approach - just create the audio element without preloading
      this.sounds.set(name, {
        name,
        file: filename,
        audio
      });

      console.log(`Loaded sound effect: ${name} (${filename})`);
    } catch (error) {
      console.error(`Failed to load sound effect ${name}:`, error);
      // Don't re-throw the error to prevent infinite loops
    }
  }

  /**
   * Load multiple sound effects from a directory
   */
  async loadSounds(soundFiles: string[]): Promise<void> {
    console.log('Loading sound files:', soundFiles);
    console.log('Sound directory:', this.soundDirectory);
    
    const loadPromises = soundFiles.map(filename => {
      const name = filename.replace(/\.[^/.]+$/, ''); // Remove file extension
      console.log(`Attempting to load: ${filename} as ${name}`);
      return this.loadSound(name, filename);
    });

    await Promise.all(loadPromises);
    console.log('All sound loading attempts completed');
  }

  /**
   * Play a sound effect by name
   */
  playSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      // Clone the audio element to allow multiple plays
      const audioClone = sound.audio.cloneNode() as HTMLAudioElement;
      audioClone.play().catch(error => {
        console.error(`Failed to play sound ${name}:`, error);
      });
    } else {
      console.warn(`Sound effect not found: ${name}`);
    }
  }

  /**
   * Get all loaded sound effect names
   */
  getSoundNames(): string[] {
    return Array.from(this.sounds.keys());
  }

  /**
   * Check if a sound effect is loaded
   */
  hasSound(name: string): boolean {
    return this.sounds.has(name);
  }

  /**
   * Get a sound effect by name
   */
  getSound(name: string): SoundEffect | undefined {
    return this.sounds.get(name);
  }

  /**
   * Unload a sound effect
   */
  unloadSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.audio.pause();
      sound.audio.src = '';
      this.sounds.delete(name);
    }
  }

  /**
   * Unload all sound effects
   */
  unloadAll(): void {
    this.sounds.forEach(sound => {
      sound.audio.pause();
      sound.audio.src = '';
    });
    this.sounds.clear();
  }
}

// Export a default instance
export const soundEffectService = new SoundEffectService();
