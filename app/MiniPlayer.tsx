import { Ionicons } from '@expo/vector-icons';
import { useSegments } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View, Modal, TouchableWithoutFeedback, ScrollView, useWindowDimensions, Image } from 'react-native';
import TextTicker from 'react-native-text-ticker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useData } from '../contexts/DataContext';
import { usePlayer } from '../contexts/PlayerContext';
import AdBanner from '../components/AdBanner';
import { refreshZenoNowPlaying } from '../lib/streamProbe';

import { calculateProgramProgress, getCurrentProgram, Program } from '../utils/timeUtils';

export default function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const { playerState, playStation, pause, stop, refreshNowPlayingTitle, setPreferredQuality } = usePlayer();
  const { programs } = useData();
  const segments = useSegments();

  const slideAnim = useRef(new Animated.Value(200)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [liveInfo, setLiveInfo] = useState<{ program: Program | null, progress: number }>({ program: null, progress: 0 });
  const [isQualityMenuVisible, setQualityMenuVisible] = useState(false);
  const [isFullPlayerVisible, setFullPlayerVisible] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Convenience alias for the stream probe result
  const streamInfo = playerState.streamInfo;

  // ── Periodic Zeno now-playing refresh ──────────────────────────────────────
  // For Zeno streams (88% of stations), poll the Zeno API every 30 s so the
  // MiniPlayer subtitle updates as the DJ changes tracks.
  const updateNowPlaying = useCallback(async () => {
    if (!playerState.currentStation?.streamUrl) return;
    const title = await refreshZenoNowPlaying(playerState.currentStation.streamUrl);
    if (title !== null) {
      refreshNowPlayingTitle(title);
    }
  }, [playerState.currentStation?.streamUrl, refreshNowPlayingTitle]);

  useEffect(() => {
    if (!playerState.currentStation) return;
    // Run once immediately after probe settles, then every 30 s
    const interval = setInterval(updateNowPlaying, 30_000);
    return () => clearInterval(interval);
  }, [playerState.currentStation?.id, updateNowPlaying]);

  // Update live info periodically.
  // We compute Haiti time once per tick and share it across both calls to avoid
  // running the (now-cached) timezone lookup more than necessary.
  // 10-second resolution is imperceptible for a slow-moving progress bar.
  useEffect(() => {
    if (!playerState.currentStation) return;

    const update = () => {
      const program = getCurrentProgram(programs as any[], playerState.currentStation!.id);
      const progress = program ? calculateProgramProgress(program) : 0;
      setLiveInfo({ program: program || null, progress });
    };

    update();
    const interval = setInterval(update, 10000); // 10s — plenty for a slow progress bar
    return () => clearInterval(interval);
  }, [playerState.currentStation]);

  // Handle entry/exit animation
  useEffect(() => {
    if (playerState.currentStation) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 200,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [playerState.currentStation]);

  // Vertical scrolling between Station and Show Name
  const lastProgramId = useRef<string | null>(null);
  useEffect(() => {
    if (!playerState.currentStation) {
      scrollAnim.setValue(0);
      lastProgramId.current = null;
      return;
    }

    const currentProgId = liveInfo.program?.id || 'live';
    if (currentProgId === lastProgramId.current) return;
    lastProgramId.current = currentProgId;

    console.log('[MiniPlayer] Starting scroll animation for:', currentProgId);
    scrollAnim.setValue(0);

    const startAnimation = () => {
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(scrollAnim, {
          toValue: -1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(4000),
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start((result) => {
        if (playerState.currentStation && result.finished) startAnimation();
      });
    };

    startAnimation();
    return () => {
      console.log('[MiniPlayer] Stopping animation');
      scrollAnim.stopAnimation();
    };
  }, [liveInfo.program?.id, playerState.currentStation?.id]);

  if (!playerState.currentStation) return null;

  const handlePlayPause = async () => {
    if (playerState.isLoading) return;
    if (playerState.isPlaying) await pause();
    else await playStation(playerState.currentStation!);
  };

  const handleSelectQuality = (qualityUrl: string | 'auto') => {
    setQualityMenuVisible(false);
    setPreferredQuality(qualityUrl);
    if (playerState.isPlaying && playerState.currentStation) {
      // Force a re-fetch of the stream with the new quality
      const stationCopy = { ...playerState.currentStation };
      stop().then(() => playStation(stationCopy));
    }
  };

  const getQualityBtnLabel = () => {
    if (playerState.preferredQuality === 'auto') return 'AUTO';
    const stream = playerState.currentStation?.streams?.find(s => s.url === playerState.preferredQuality);
    return stream ? `${stream.bitrate}k` : 'AUTO';
  };

  const logoSource = playerState.currentStation?.logo
    ? { uri: playerState.currentStation.logo.startsWith('http') ? playerState.currentStation.logo : `https:${playerState.currentStation.logo}` }
    : require('../assets/images/app-icon-primary.png');

  const translateY = scrollAnim.interpolate({
    inputRange: [-1, 0],
    outputRange: [-24, 0], // Heights for the vertical shift
  });

  const bottomOffset = insets.bottom;

  return (
    <Animated.View
      style={[
        styles.container,
        isLandscape ? [styles.containerLandscape, { width: 200 + Math.max(0, insets.left), paddingLeft: Math.max(0, insets.left) }] : {},
        {
          transform: [{ translateY: slideAnim }],
          bottom: bottomOffset,
          height: isLandscape ? 120 : 64, // Taller in landscape to fit logo and controls
        },
      ]}
    >
      <View style={[styles.contentContainer, isLandscape ? styles.contentContainerLandscape : {}]}>
        <View style={[styles.mainRow, isLandscape ? styles.mainRowLandscape : {}]}>
          <TouchableOpacity
            style={[styles.leftGroup, isLandscape ? styles.leftGroupLandscape : {}]}
            activeOpacity={0.8}
            onPress={() => setFullPlayerVisible(true)}
          >
            <Image source={logoSource} style={[styles.stationLogo, isLandscape ? styles.stationLogoLandscape : {}]} resizeMode="contain" />
            <View style={[styles.infoSection, isLandscape ? styles.infoSectionLandscape : {}]}>
              <View style={styles.scrollClip}>
                <Animated.View style={{ transform: [{ translateY }] }}>
                  <View style={styles.textTrack}>
                    <TextTicker
                      style={styles.stationTitle}
                      scrollSpeed={40}
                      loop
                      bounce={false}
                      repeatSpacer={50}
                      marqueeDelay={2000}
                    >
                      {playerState.currentStation.name}
                    </TextTicker>
                  </View>
                  <View style={styles.textTrack}>
                    <TextTicker
                      style={styles.programTitle}
                      scrollSpeed={40}
                      loop
                      bounce={false}
                      repeatSpacer={50}
                      marqueeDelay={2000}
                    >
                      {streamInfo?.nowPlaying
                        ? streamInfo.nowPlaying
                        : liveInfo.program && liveInfo.program.name.trim() !== '-'
                          ? liveInfo.program.name
                          : liveInfo.program?.description
                            ? liveInfo.program.description
                            : liveInfo.program?.host
                              ? liveInfo.program.host
                              : 'Live Stream'}
                    </TextTicker>
                  </View>
                </Animated.View>
              </View>

              {playerState.error ? (
                <Text style={styles.error} numberOfLines={1}>
                  {playerState.error}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

          <View style={[styles.controls, isLandscape ? styles.controlsLandscape : {}]}>
            {playerState.currentStation?.streams && playerState.currentStation.streams.length > 0 ? (
              <TouchableOpacity onPress={() => setQualityMenuVisible(true)} style={styles.qualityBtn} activeOpacity={0.7}>
                <Text style={styles.qualityText}>
                  {getQualityBtnLabel()}
                </Text>
              </TouchableOpacity>
            ) : null}
            {playerState.isLoading ? (
              <ActivityIndicator size="small" color="#a78bfa" style={styles.loadingIndicator} />
            ) : (
              <TouchableOpacity onPress={handlePlayPause} style={styles.button} activeOpacity={0.7}>
                <Ionicons
                  name={playerState.isPlaying ? "pause" : "play"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => stop()} style={styles.button} activeOpacity={0.7}>
              <Ionicons name="square" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Show Progress Bar */}
        {liveInfo.program ? (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${liveInfo.progress * 100}%` }]} />
          </View>
        ) : null}
      </View>

      {/* Full Player Modal */}
      <Modal visible={isFullPlayerVisible} animationType="slide" transparent={false} onRequestClose={() => setFullPlayerVisible(false)}>
        <LinearGradient colors={['#2e1065', '#000000']} style={[styles.fullPlayerBackground, { paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: insets.bottom }]}>
          <View style={styles.fullPlayerHeader}>
            <TouchableOpacity onPress={() => setFullPlayerVisible(false)} style={styles.fullPlayerCloseBtn}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <Ionicons name="chevron-back" size={24} color="#fff" style={{ marginLeft: -2 }} />
            </TouchableOpacity>
            <Text style={styles.fullPlayerHeaderText}>Now Playing</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={[styles.fullPlayerScroll, isLandscape && styles.fullPlayerScrollLandscape]}>
            <View style={isLandscape ? styles.fullPlayerRowLandscape : {}}>
              <View style={isLandscape ? styles.fullPlayerLeftColLandscape : {}}>
                <View style={[styles.fullPlayerArtworkContainer, isLandscape ? styles.fullPlayerArtworkLandscape : {}]}>
                  <Image
                    source={
                      liveInfo.program?.poster
                        ? { uri: liveInfo.program.poster.startsWith('http') ? liveInfo.program.poster : `https:${liveInfo.program.poster}` }
                        : logoSource
                    }
                    style={[styles.fullPlayerArtwork, isLandscape ? styles.fullPlayerArtworkImageLandscape : {}]}
                    resizeMode="contain"
                  />
                </View>
                {isLandscape && (
                  <View style={styles.landscapeAdContainer}>
                    <AdBanner type="banner" />
                  </View>
                )}
              </View>

              <View style={isLandscape ? styles.fullPlayerRightColLandscape : {}}>
                <View style={styles.fullPlayerInfo}>
                  <TextTicker style={styles.fullPlayerStationTitle} scrollSpeed={40} loop bounce={false} repeatSpacer={50} marqueeDelay={2000}>
                    {playerState.currentStation.name}
                  </TextTicker>
                  <TextTicker style={styles.fullPlayerProgramTitle} scrollSpeed={40} loop bounce={false} repeatSpacer={50} marqueeDelay={2000}>
                    {streamInfo?.nowPlaying
                      ? streamInfo.nowPlaying
                      : liveInfo.program && liveInfo.program.name.trim() !== '-'
                        ? liveInfo.program.name
                        : liveInfo.program?.description
                          ? liveInfo.program.description
                          : liveInfo.program?.host
                            ? liveInfo.program.host
                            : 'Live Stream'}
                  </TextTicker>
                  {playerState.error ? (
                    <Text style={styles.fullPlayerError} numberOfLines={2}>{playerState.error}</Text>
                  ) : null}
                </View>

                {liveInfo.program ? (
                  <View style={styles.fullPlayerProgressWrapper}>
                    <View style={styles.fullPlayerProgressBarContainer}>
                      <View style={[styles.fullPlayerProgressBar, { width: `${liveInfo.progress * 100}%` }]} />
                    </View>
                  </View>
                ) : null}

                <View style={styles.fullPlayerControls}>
                  {playerState.currentStation?.streams && playerState.currentStation.streams.length > 0 ? (
                    <TouchableOpacity onPress={() => setQualityMenuVisible(true)} style={styles.fullPlayerControlBtn} activeOpacity={0.7}>
                      <Ionicons name="options" size={32} color="#d1d5db" />
                      <Text style={styles.fullPlayerQualityText}>{getQualityBtnLabel()}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.fullPlayerControlBtn} />
                  )}

                  {playerState.isLoading ? (
                    <ActivityIndicator size="large" color="#a78bfa" style={styles.fullPlayerPlayPauseBtn} />
                  ) : (
                    <TouchableOpacity onPress={handlePlayPause} style={styles.fullPlayerPlayPauseBtn} activeOpacity={0.7}>
                      <Ionicons name={playerState.isPlaying ? "pause-circle" : "play-circle"} size={80} color="#fff" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity onPress={() => stop()} style={styles.fullPlayerControlBtn} activeOpacity={0.7}>
                    <Ionicons name="square" size={32} color="#d1d5db" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {!isLandscape && (
            <View style={styles.portraitAdContainer}>
              <AdBanner type="banner" />
            </View>
          )}
        </LinearGradient>
      </Modal>

      {/* Quality Selection Modal */}
      <Modal visible={isQualityMenuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setQualityMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Stream Quality</Text>
                <ScrollView style={styles.modalScroll}>
                  <TouchableOpacity
                    style={[styles.modalOption, playerState.preferredQuality === 'auto' && styles.modalOptionActive]}
                    onPress={() => handleSelectQuality('auto')}
                  >
                    <Text style={[styles.modalOptionText, playerState.preferredQuality === 'auto' && styles.modalOptionTextActive]}>
                      Auto (Smart Selection)
                    </Text>
                  </TouchableOpacity>

                  {playerState.currentStation?.streams && [...playerState.currentStation.streams].sort((a, b) => b.bitrate - a.bitrate).map((stream, idx) => {
                    const isActive = playerState.preferredQuality === stream.url;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.modalOption, isActive && styles.modalOptionActive]}
                        onPress={() => handleSelectQuality(stream.url)}
                      >
                        <Text style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]}>
                          {stream.label} ({stream.bitrate}k {stream.format.toUpperCase()})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    // bottom is dynamic based on isInTabs
    backgroundColor: 'rgba(0,0,0,0.7)',
    overflow: 'hidden',
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    height: 64,
    justifyContent: 'center',
  },
  containerLandscape: {
    right: 'auto',
    width: 200,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#121212',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  contentContainerLandscape: {
    paddingVertical: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    flex: 1,
    width: '100%',
  },
  mainRowLandscape: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 0,
    paddingHorizontal: 12,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  leftGroupLandscape: {
    width: '100%',
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoSection: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  infoSectionLandscape: {
    flex: 1,
    width: 'auto',
  },
  stationLogo: {
    width: 70,
    height: 44,
    borderRadius: 6,
    marginRight: 12,
  },
  stationLogoLandscape: {
    width: '30%',
    height: 44,
    borderRadius: 6,
    marginRight: 0,
    alignSelf: 'center',
  },
  scrollClip: {
    height: 24,
    overflow: 'hidden',
  },
  textTrack: {
    height: 24,
    justifyContent: 'center',
  },
  stationTitle: {
    color: '#a78bfa',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  programTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    fontSize: 10,
    position: 'absolute',
    bottom: -12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  controlsLandscape: {
    width: '100%',
    justifyContent: 'space-evenly',
    gap: 4,
  },
  button: {
    padding: 8,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 28,
    textAlign: 'center',
    includeFontPadding: false,
    color: '#fff',
  },
  loadingIndicator: {
    padding: 8,
    marginLeft: 10,
  },
  progressContainer: {
    position: 'absolute',
    top: 0, // Progress at top of the bar for Spotify look
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#a78bfa',
  },
  qualityBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 280,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  modalTitle: {
    color: '#a78bfa',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  modalOptionText: {
    color: '#d1d5db',
    fontSize: 16,
  },
  modalOptionTextActive: {
    color: '#a78bfa',
    fontWeight: 'bold',
  },
  fullPlayerBackground: {
    flex: 1,
  },
  fullPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fullPlayerCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fullPlayerHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fullPlayerScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  fullPlayerScrollLandscape: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  fullPlayerRowLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  fullPlayerLeftColLandscape: {
    flex: 1,
    paddingRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPlayerRightColLandscape: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  landscapeAdContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  portraitAdContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 10,
  },
  fullPlayerArtworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  fullPlayerArtworkLandscape: {
    marginBottom: 0,
  },
  fullPlayerArtwork: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 400,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  fullPlayerArtworkImageLandscape: {
    width: 'auto',
    height: 200,
    aspectRatio: 1,
  },
  fullPlayerInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  fullPlayerStationTitle: {
    color: '#a78bfa',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  fullPlayerProgramTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    opacity: 0.8,
    textAlign: 'center',
  },
  fullPlayerError: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fullPlayerProgressWrapper: {
    marginBottom: 40,
    width: '100%',
  },
  fullPlayerProgressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fullPlayerProgressBar: {
    height: '100%',
    backgroundColor: '#a78bfa',
    borderRadius: 3,
  },
  fullPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  fullPlayerControlBtn: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPlayerPlayPauseBtn: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPlayerQualityText: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  }
});