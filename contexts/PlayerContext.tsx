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
    try {
      setError(null);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

      // If it's already the current station, toggle play/pause
      if (currentStation?.id === station.id) {
        if (status.playing) {
          player.pause();
        } else {
          player.play();
        }
        return;
      }

      // New station logic
      setCurrentStation(station);
      await addToHistory(station.id);
      
      // Stop current before replacing source
      player.pause();
      player.replace({ uri: station.streamUrl });
      player.play();

      // Start a 15-second timeout for loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (!player.playing && !player.isBuffering) {
          setError('Station is currently unreachable. Please try another.');
          player.pause();
          setCurrentStation(null);
        }
      }, 15000);
    } catch (err) {
      setError('Failed to play station. Please try again.');
      console.error('Playback error:', err);
    }
  };

  const pause = async () => {
    player.pause();
  };

  const stop = async () => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    player.pause();
    setCurrentStation(null);
  };

  // Clear timeout when playback starts
  useEffect(() => {
    if (status.playing && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [status.playing]);

  const playerState: PlayerState = {
    isPlaying: status.playing,
    // Avoid showing loading forever if it's already playing
    isLoading: status.isBuffering && !status.playing,
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
 