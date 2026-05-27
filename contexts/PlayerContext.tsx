import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import TrackPlayer, { 
  AppKilledPlaybackBehavior, 
  Capability, 
  State, 
  usePlaybackState, 
  useTrackPlayerEvents, 
  Event, 
  Track,
  TrackType
} from 'react-native-track-player';
import { useHistory } from './HistoryContext';
import { probeStream, StreamInfo } from '../lib/streamProbe';
import { resolveStreamUrl } from '../lib/playlistParser';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentStation: { id: string; name: string; streamUrl: string; logo?: string } | null;
  streamInfo: StreamInfo | null;
  error: string | null;
}

interface PlayerContextType {
  playerState           : PlayerState;
  playStation           : (station: { id: string; name: string; streamUrl: string; logo?: string }) => Promise<void>;
  pause                 : () => Promise<void>;
  stop                  : () => Promise<void>;
  /** Patch the nowPlaying title in streamInfo without re-running the full probe. */
  refreshNowPlayingTitle: (title: string) => void;
}

// ─── Context default ─────────────────────────────────────────────────────────

const PlayerContext = createContext<PlayerContextType>({
  playerState           : { isPlaying: false, isLoading: false, currentStation: null, streamInfo: null, error: null },
  playStation           : async () => {},
  pause                 : async () => {},
  stop                  : async () => {},
  refreshNowPlayingTitle: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToHistory } = useHistory();
  const [currentStation, setCurrentStation] = useState<{ id: string; name: string; streamUrl: string; logo?: string } | null>(null);
  const [streamInfo, setStreamInfo]         = useState<StreamInfo | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [isSetup, setIsSetup]               = useState(false);

  // Ref tracking which station the in-flight probe was started for.
  // If the user switches stations before the probe finishes, we discard
  // the stale result — it belongs to the old station.
  const probingForIdRef = useRef<string | null>(null);

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
    // console.warn (not .error) so Expo dev overlay doesn't appear for expected stream failures
    console.warn('[Player] Playback error:', JSON.stringify(event));
    const code = (event as any)?.code || '';
    if (code === 'android-io-bad-http-status') {
      setError('Stream unavailable. The station may be offline.');
    } else {
      setError('Failed to play station. Please try again.');
    }
  });

  const playStation = useCallback(async (station: { id: string; name: string; streamUrl: string; logo?: string }) => {
    if (!isSetup) await setupPlayer();
    
    console.log('[Player] Playing station:', station.name);
    try {
      setError(null);

      // Non-blocking history update
      addToHistory(station.id).catch(err => console.error('[Player] History error:', err));

      // ── Same station: toggle play / pause ──────────────────────────────────
      if (currentStation?.id === station.id) {
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

      // ── New station ────────────────────────────────────────────────────────
      console.log('[Player] Switching to new station:', station.streamUrl);

      // Clear previous stream info immediately so the UI shows a clean state
      setStreamInfo(null);
      setCurrentStation(station);

      const resolvedAudioUrl = await resolveStreamUrl(station.streamUrl);

      const track: Track = {
        id     : station.id,
        url    : resolvedAudioUrl,
        type   : resolvedAudioUrl.includes('.m3u8') ? TrackType.HLS : TrackType.Default,
        title  : station.name,
        artist : 'Rezoa Radio',
        // Use station logo if available, otherwise fall back to a placeholder
        artwork: station.logo
          ? (station.logo.startsWith('//') ? `https:${station.logo}` : station.logo)
          : 'https://via.placeholder.com/150',
        // Tell ICY/SHOUTcast servers to send inline metadata,
        // and present as a known media player so stream hosts don't block us
        headers: {
          'Icy-MetaData': '1',
          'User-Agent'  : 'VLC/3.0 LibVLC/3.0',
        },
      };

      await TrackPlayer.reset();
      await TrackPlayer.add([track]);
      await TrackPlayer.play();

      // ── Fire stream probe NON-BLOCKING ─────────────────────────────────────
      // TrackPlayer is already playing. We run the probe in the background and
      // update the UI once metadata arrives (typically 1–5 seconds later).
      // We tag which station the probe belongs to so we can discard stale results.
      probingForIdRef.current = station.id;
      const stationId = station.id;

      probeStream(station.streamUrl).then(info => {
        // Guard: ignore result if user has already switched away
        if (probingForIdRef.current !== stationId) {
          console.log('[Player] Discarding stale probe result for:', station.name);
          return;
        }
        console.log('[Player] Stream probe result:', {
          protocol  : info.protocol,
          icyName   : info.icyName,
          genre     : info.icyGenre,
          bitrate   : info.icyBitrate,
          nowPlaying: info.nowPlaying,
        });
        setStreamInfo(info);
      });
      // probeStream never rejects — no .catch() needed

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
      probingForIdRef.current = null;
      setCurrentStation(null);
      setStreamInfo(null);
      setError(null);
    }
  }, []);

  /** Patch only the nowPlaying field — avoids a full re-probe. */
  const refreshNowPlayingTitle = useCallback((title: string) => {
    setStreamInfo(prev =>
      prev ? { ...prev, nowPlaying: title || null } : prev
    );
  }, []);

  // ── Derived playback flags ────────────────────────────────────────────────
  // TrackPlayer 4.0+ returns an object with state from usePlaybackState
  const currentState = (playbackState as any)?.state || playbackState;
  const isPlaying    = currentState === State.Playing;
  const isLoading    = currentState === State.Loading || currentState === State.Buffering;

  // ── Memoised context values ───────────────────────────────────────────────
  const playerState = useMemo<PlayerState>(() => ({
    isPlaying,
    isLoading,
    currentStation,
    streamInfo,
    error,
  }), [isPlaying, isLoading, currentStation, streamInfo, error]);

  const contextValue = useMemo(
    () => ({ playerState, playStation, pause, stop, refreshNowPlayingTitle }),
    [playerState, playStation, pause, stop, refreshNowPlayingTitle]
  );

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    console.warn('PlayerContext not found, using fallback.');
    return {
      playerState           : { isPlaying: false, isLoading: false, currentStation: null, streamInfo: null, error: null },
      playStation           : async () => {},
      pause                 : async () => {},
      stop                  : async () => {},
      refreshNowPlayingTitle: () => {},
    };
  }
  return context;
};