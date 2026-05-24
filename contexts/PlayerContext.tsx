import { setAudioModeAsync, useAudioPlayerStatus } from 'expo-audio';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
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

const PlayerStatusListener = React.memo(({ player, onStatusChange }: { player: any, onStatusChange: (status: any) => void }) => {
  const status = useAudioPlayerStatus(player);
  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);
  return null;
});

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToHistory } = useHistory();
  const [currentStation, setCurrentStation] = useState<{ id: string; name: string; streamUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayerState] = useState<AudioPlayer | null>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [status, setStatus] = useState({
    isLoaded: false,
    playing: false,
    currentTime: 0,
    duration: 0,
    playbackState: 'stopped',
    timeControlStatus: 'paused',
    reasonForWaitingToPlay: '',
    mute: false,
    loop: false,
    didJustFinish: false,
    isBuffering: false,
    playbackRate: 1,
    shouldCorrectPitch: false
  });

  const handleStatusChange = useCallback((newStatus: any) => {
    setStatus(newStatus);
  }, []);

  useEffect(() => {
    if (player) {
      player.volume = 1.0;
    }
  }, [player]);

  let audioModeConfigured = false;

  const playStation = async (station: { id: string; name: string; streamUrl: string }) => {
    console.log('[Player] Playing station:', station.name);
    try {
      if (!audioModeConfigured) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
          interruptionModeAndroid: 'doNotMix',
        }).catch(err => console.log('Error setting audio mode:', err));
        audioModeConfigured = true;
      }

      setError(null);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

      // 1. Non-blocking history update
      addToHistory(station.id).catch(err => console.error('[Player] History error:', err));

      let currentPlayer = player;

      // 2. If it's already the current station, toggle play/pause
      if (currentStation?.id === station.id && currentPlayer) {
        if (status.playing) {
          console.log('[Player] Pausing current station');
          currentPlayer.pause();
        } else {
          console.log('[Player] Resuming current station');
          currentPlayer.play();
        }
        return;
      }

      // 3. New station logic
      console.log('[Player] Switching to new station:', station.streamUrl);
      setCurrentStation(station);
      
      if (!currentPlayer) {
        import('expo-audio').then(({ createAudioPlayer }) => {
          const newPlayer = createAudioPlayer(station.streamUrl);
          setPlayerState(newPlayer);
          newPlayer.play();
        });
      } else {
        currentPlayer.pause();
        currentPlayer.replace({ uri: station.streamUrl });
        currentPlayer.play();
      }

      // Start a 15-second timeout for loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (player && !player.playing && !player.isBuffering) {
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
      if (player) player.pause();
    } catch (err) {
      console.error('[Player] Pause error:', err);
    }
  };

  const stop = async () => {
    console.log('[Player] Stop called');
    try {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (player) player.pause();
    } catch (err) {
      console.error('[Player] Stop error:', err);
    } finally {
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
      {player && <PlayerStatusListener player={player} onStatusChange={handleStatusChange} />}
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
 