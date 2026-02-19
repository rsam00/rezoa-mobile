import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from './HistoryContext';

interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: { id: string; name: string; streamUrl: string } | null;
  error: string | null;
}

interface PlayerContextType {
  playerState: PlayerState;
  playStation: (station: { id: string; name: string; streamUrl: string }) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType>({
  playerState: { isPlaying: false, isLoading: false, currentStation: null, error: null },
  playStation: async () => {},
  pause: async () => {},
  stop: async () => {},
});

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToHistory } = useHistory();
  const [currentStation, setCurrentStation] = useState<{ id: string; name: string; streamUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<any>(null);

  // Initialize player with null source
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    player.volume = 1.0;
  }, [player]);

  useEffect(() => {
    // Configure background audio
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      interruptionModeAndroid: 'doNotMix',
    }).catch(err => console.log('Error setting audio mode:', err));
  }, []);

  const playStation = async (station: { id: string; name: string; streamUrl: string }) => {
    console.log('[Player] Playing station:', station.name);
    try {
      setError(null);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

      // 1. Non-blocking history update
      addToHistory(station.id).catch(err => console.error('[Player] History error:', err));

      // 2. If it's already the current station, toggle play/pause
      if (currentStation?.id === station.id) {
        if (status.playing) {
          console.log('[Player] Pausing current station');
          player.pause();
        } else {
          console.log('[Player] Resuming current station');
          player.play();
        }
        return;
      }

      // 3. New station logic
      console.log('[Player] Switching to new station:', station.streamUrl);
      setCurrentStation(station);
      
      // Stop and replace
      player.pause();
      player.replace({ uri: station.streamUrl });
      player.play();

      // Start a 15-second timeout for loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (!player.playing && !player.isBuffering) {
          setError('Station is currently unreachable. Please try another.');
          console.warn('[Player] Loading timeout reached');
          stop();
        }
      }, 15000);
    } catch (err) {
      setError('Failed to play station. Please try again.');
      console.error('[Player] Playback error:', err);
    }
  };

  const pause = async () => {
    console.log('[Player] Pause called');
    try {
      player.pause();
    } catch (err) {
      console.error('[Player] Pause error:', err);
    }
  };

  const stop = async () => {
    console.log('[Player] Stop called');
    try {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      player.pause();
    } catch (err) {
      console.error('[Player] Stop error:', err);
    } finally {
      // Always clear state even if player.pause() fails
      setCurrentStation(null);
      setError(null);
    }
  };

  // Clear timeout when playback starts
  useEffect(() => {
    if (status.playing && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
      console.log('[Player] Playback started, cleared timeout');
    }
  }, [status.playing]);

  const playerState: PlayerState = {
    isPlaying: status.playing,
    isLoading: (status.isBuffering && !status.playing) || (currentStation !== null && !status.isLoaded && !status.playing),
    currentStation,
    error: error,
  };

  return (
    <PlayerContext.Provider value={{ playerState, playStation, pause, stop }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    console.warn('PlayerContext not found, using fallback.');
    return {
      playerState: { isPlaying: false, isLoading: false, currentStation: null, error: null },
      playStation: async () => {},
      pause: async () => {},
      stop: async () => {},
    };
  }
  return context;
};
 