import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import TrackPlayer, { 
  AppKilledPlaybackBehavior, 
  Capability, 
  State, 
  usePlaybackState, 
  useTrackPlayerEvents, 
  Event, 
  Track 
} from 'react-native-track-player';
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
  const [isSetup, setIsSetup] = useState(false);
  
  const playbackState = usePlaybackState();

  useEffect(() => {
    setupPlayer();
  }, []);

  const setupPlayer = async () => {
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
      });
      setIsSetup(true);
    } catch (e) {
      console.log('TrackPlayer setup error (may already be setup):', e);
      setIsSetup(true);
    }
  };

  useTrackPlayerEvents([Event.PlaybackError], (event) => {
    console.error('TrackPlayer error:', event);
    setError('Failed to play station. Please try again.');
  });

  const playStation = useCallback(async (station: { id: string; name: string; streamUrl: string }) => {
    if (!isSetup) await setupPlayer();
    
    console.log('[Player] Playing station:', station.name);
    try {
      setError(null);

      // Non-blocking history update
      addToHistory(station.id).catch(err => console.error('[Player] History error:', err));

      // If it's already the current station, toggle play/pause
      if (currentStation?.id === station.id) {
        // TrackPlayer 4.0+ playbackState is an object: { state: State }
        // We will just call play() if it's paused
        const state = (playbackState as any)?.state || playbackState;
        if (state === State.Playing) {
          console.log('[Player] Pausing current station');
          await TrackPlayer.pause();
        } else {
          console.log('[Player] Resuming current station');
          await TrackPlayer.play();
        }
        return;
      }

      // New station logic
      console.log('[Player] Switching to new station:', station.streamUrl);
      setCurrentStation(station);
      
      const track: Track = {
        id: station.id,
        url: station.streamUrl,
        title: station.name,
        artist: 'Rezoa Radio',
        artwork: 'https://via.placeholder.com/150', // Replace with actual logo if available
      };

      await TrackPlayer.reset();
      await TrackPlayer.add([track]);
      await TrackPlayer.play();
      
    } catch (err) {
      setError('Failed to play station. Please try again.');
      console.error('[Player] Playback error:', err);
    }
  }, [isSetup, currentStation?.id, playbackState, addToHistory]);

  const pause = useCallback(async () => {
    console.log('[Player] Pause called');
    try {
      await TrackPlayer.pause();
    } catch (err) {
      console.error('[Player] Pause error:', err);
    }
  }, []);

  const stop = useCallback(async () => {
    console.log('[Player] Stop called');
    try {
      await TrackPlayer.stop();
    } catch (err) {
      console.error('[Player] Stop error:', err);
    } finally {
      setCurrentStation(null);
      setError(null);
    }
  }, []);

  // Compute playing/loading booleans efficiently
  // TrackPlayer 4.0+ returns an object with state from usePlaybackState
  const currentState = (playbackState as any)?.state || playbackState;
  
  const isPlaying = currentState === State.Playing;
  const isLoading = currentState === State.Loading || currentState === State.Buffering;

  // Memoize playerState so consumers only re-render when a value they care about actually changes
  const playerState = useMemo<PlayerState>(() => ({
    isPlaying,
    isLoading,
    currentStation,
    error,
  }), [isPlaying, isLoading, currentStation, error]);

  // Memoize the context value object itself
  const contextValue = useMemo(() => ({ playerState, playStation, pause, stop }),
    [playerState, playStation, pause, stop]
  );

  return (
    <PlayerContext.Provider value={contextValue}>
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