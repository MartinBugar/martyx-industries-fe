import { useCallback, useEffect, useRef, useState } from 'react';
import { logDebug } from '../services/logger';

/**
 * Sound effect types for different interactions.
 */
export type SoundEffect = 'addToCart' | 'removeFromCart' | 'success' | 'error' | 'notification' | 'click';

interface SoundEffectsOptions {
  enabled?: boolean;
  volume?: number; // 0.0 to 1.0
}

interface SoundEffectsReturn {
  play: (sound: SoundEffect) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

// Storage key for user preference
const SOUND_ENABLED_KEY = 'martyx_sound_enabled';
const SOUND_VOLUME_KEY = 'martyx_sound_volume';

// Base64 encoded minimal sounds (tiny WAV files ~1KB each)
// These are simple sine wave tones generated programmatically
const SOUND_FREQUENCIES: Record<SoundEffect, { freq: number; duration: number; type: OscillatorType }> = {
  addToCart: { freq: 800, duration: 0.1, type: 'sine' },      // Quick high ping
  removeFromCart: { freq: 400, duration: 0.15, type: 'sine' }, // Lower tone
  success: { freq: 600, duration: 0.2, type: 'sine' },        // Pleasant confirmation
  error: { freq: 200, duration: 0.3, type: 'square' },        // Low buzz
  notification: { freq: 700, duration: 0.15, type: 'sine' },  // Alert ping
  click: { freq: 1000, duration: 0.05, type: 'sine' },        // Very quick tap
};

/**
 * Hook for playing sound effects on user interactions.
 * Sounds are disabled by default and must be enabled by the user.
 *
 * Usage:
 * ```tsx
 * const { play, isEnabled, setEnabled, volume, setVolume } = useSoundEffects();
 *
 * const handleAddToCart = () => {
 *   play('addToCart');
 *   // ... add to cart logic
 * };
 *
 * // In settings:
 * <Switch checked={isEnabled} onChange={setEnabled} />
 * <Slider value={volume} onChange={setVolume} min={0} max={1} step={0.1} />
 * ```
 */
export function useSoundEffects(options: SoundEffectsOptions = {}): SoundEffectsReturn {
  const { enabled: initialEnabled = false, volume: initialVolume = 0.3 } = options;

  // Load user preferences from localStorage
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return initialEnabled;
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored !== null ? stored === 'true' : initialEnabled;
  });

  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === 'undefined') return initialVolume;
    const stored = localStorage.getItem(SOUND_VOLUME_KEY);
    return stored !== null ? parseFloat(stored) : initialVolume;
  });

  // Audio context reference (created on first interaction)
  const audioContextRef = useRef<AudioContext | null>(null);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, String(isEnabled));
  }, [isEnabled]);

  useEffect(() => {
    localStorage.setItem(SOUND_VOLUME_KEY, String(volume));
  }, [volume]);

  // Get or create AudioContext
  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;

    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      } catch {
        logDebug('AudioContext not supported');
        return null;
      }
    }

    // Resume if suspended (required after user interaction)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    return audioContextRef.current;
  }, []);

  const play = useCallback((sound: SoundEffect) => {
    if (!isEnabled) return;

    const audioContext = getAudioContext();
    if (!audioContext) return;

    try {
      const { freq, duration, type } = SOUND_FREQUENCIES[sound];

      // Create oscillator
      const oscillator = audioContext.createOscillator();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

      // Create gain node for volume control and fade out
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime); // Keep sounds subtle
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      // Connect and play
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      logDebug('Failed to play sound:', error);
    }
  }, [isEnabled, volume, getAudioContext]);

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    play,
    isEnabled,
    setEnabled,
    volume,
    setVolume,
  };
}

/**
 * Standalone function to play a sound effect.
 * Creates a temporary AudioContext if needed.
 * Respects user's stored preference.
 */
let sharedAudioContext: AudioContext | null = null;

export function playSoundEffect(sound: SoundEffect): void {
  if (typeof window === 'undefined') return;

  // Check user preference
  const enabled = localStorage.getItem(SOUND_ENABLED_KEY) === 'true';
  if (!enabled) return;

  const volume = parseFloat(localStorage.getItem(SOUND_VOLUME_KEY) || '0.3');

  try {
    if (!sharedAudioContext) {
      sharedAudioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }

    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }

    const { freq, duration, type } = SOUND_FREQUENCIES[sound];

    const oscillator = sharedAudioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, sharedAudioContext.currentTime);

    const gainNode = sharedAudioContext.createGain();
    gainNode.gain.setValueAtTime(volume * 0.3, sharedAudioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, sharedAudioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(sharedAudioContext.destination);

    oscillator.start(sharedAudioContext.currentTime);
    oscillator.stop(sharedAudioContext.currentTime + duration);
  } catch {
    // Silently fail
  }
}

export default useSoundEffects;
