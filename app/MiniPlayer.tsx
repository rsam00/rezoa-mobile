import { BlurView } from 'expo-blur';
import { useSegments } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../contexts/DataContext';
import { usePlayer } from '../contexts/PlayerContext';

import { calculateProgramProgress, getCurrentProgram, Program } from '../utils/timeUtils';

export default function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const { playerState, playStation, pause, stop } = usePlayer();
  const { programs } = useData();
  const segments = useSegments();
  // Robust check for tabs: check if any segment is (tabs)
  const isInTabs = (segments as string[]).includes('(tabs)');
  
  const slideAnim = useRef(new Animated.Value(200)).current; 
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [liveInfo, setLiveInfo] = useState<{ program: Program | null, progress: number }>({ program: null, progress: 0 });

  // Update live info periodically
  useEffect(() => {
    if (!playerState.currentStation) return;

    const update = () => {
      const program = getCurrentProgram(programs as any[], playerState.currentStation!.id);
      const progress = program ? calculateProgramProgress(program) : 0;
      setLiveInfo({ program: program || null, progress });
    };

    update();
    const interval = setInterval(update, 1000); // Update every second for smooth progress
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
  useEffect(() => {
    if (!playerState.currentStation) {
      scrollAnim.setValue(0);
      return;
    }

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
      ]).start(() => {
        if (playerState.currentStation) startAnimation();
      });
    };

    startAnimation();
    return () => scrollAnim.stopAnimation();
  }, [liveInfo.program, playerState.currentStation]);

  if (!playerState.currentStation) return null;

  const handlePlayPause = async () => {
    if (playerState.isLoading) return;
    if (playerState.isPlaying) await pause();
    else await playStation(playerState.currentStation!);
  };

  const translateY = scrollAnim.interpolate({
    inputRange: [-1, 0],
    outputRange: [-24, 0], // Heights for the vertical shift
  });

  const bottomOffset = isInTabs ? 60 + insets.bottom : insets.bottom;

  return (
    <Animated.View
      style={[
        styles.container, 
        { 
          transform: [{ translateY: slideAnim }],
          bottom: bottomOffset, // Docked exactly on top of TabBar or bottom of screen
        },
      ]}
    >
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.contentContainer}>
        <View style={styles.mainRow}>
          <View style={styles.infoSection}>
            <View style={styles.scrollClip}>
              <Animated.View style={{ transform: [{ translateY }] }}>
                <View style={styles.textTrack}>
                  <Text style={styles.stationTitle} numberOfLines={1}>
                    {playerState.currentStation.name}
                  </Text>
                </View>
                <View style={styles.textTrack}>
                  <Text style={styles.programTitle} numberOfLines={1}>
                    {liveInfo.program ? liveInfo.program.name : 'Live Stream'}
                  </Text>
                </View>
              </Animated.View>
            </View>
            
            {playerState.error && (
              <Text style={styles.error} numberOfLines={1}>
                {playerState.error}
              </Text>
            )}
          </View>

          <View style={styles.controls}>
            {playerState.isLoading ? (
              <ActivityIndicator size="small" color="#a78bfa" style={styles.loadingIndicator} />
            ) : (
              <TouchableOpacity onPress={handlePlayPause} style={styles.button}>
                <Text style={styles.buttonText}>
                  {playerState.isPlaying ? '⏸' : '▶️'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => stop()} style={styles.button}>
              <Text style={styles.buttonText}>⏹</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Show Progress Bar */}
        {liveInfo.program && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${liveInfo.progress * 100}%` }]} />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    // bottom is dynamic based on isInTabs
    backgroundColor: 'rgba(0,0,0,0.95)',
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    height: 64,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
  },
  infoSection: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
    overflow: 'hidden',
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
    fontSize: 14,
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
  },
  button: {
    padding: 2,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 28,
    textAlign: 'center',
    includeFontPadding: false,
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
});