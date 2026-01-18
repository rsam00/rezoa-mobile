import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useData } from '../contexts/DataContext';
import { usePlayer } from '../contexts/PlayerContext';
import { getCurrentProgram as isLive } from '../utils/timeUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 420;

type AnimatedCardProps = React.PropsWithChildren<{ onPress: () => void; style?: any; [key: string]: any }>;
function AnimatedCard({ children, onPress, ...props }: AnimatedCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
      accessibilityRole="button"
      accessible={true}
      {...props}
      style={undefined}
    >
      <Animated.View style={[{ transform: [{ scale }] }, props.style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function ProgramDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { programs, stations, loading, recordProgramClick } = useData();
  const program = programs.find(p => p.id === id);

  React.useEffect(() => {
    if (program) {
      recordProgramClick(program.id);
    }
  }, [program]);
  const station = program ? stations.find(s => s.id === program.stationId) : null;
  const router = useRouter();
  const { playStation } = usePlayer();

  const isProgramLive = useMemo(() => {
    if (!program) return false;
    return !!isLive([program as any], program.stationId);
  }, [program]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#a78bfa" />
      </SafeAreaView>
    );
  }

  if (!program) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.programTitle}>Program not found</Text>
      </SafeAreaView>
    );
  }

  const logoSource = station?.logo ? { uri: station.logo.startsWith('http') ? station.logo : `https:${station.logo}` } : require('../assets/images/favicon.png');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header Hero Section */}
        <View style={styles.heroRoot}>
          <View style={styles.heroWrapper}>
            {/* Immersive Background */}
            <View style={styles.heroBackgroundContainer}>
              {program.poster ? (
                <Image source={{ uri: program.poster }} style={styles.heroBlurBg} resizeMode="cover" />
              ) : (
                <View style={[styles.heroBlurBg, { backgroundColor: '#1c1c1e' }]}>
                   <LinearGradient
                    colors={['#a78bfa', '#5b21b6', '#1e1b4b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              )}
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)', 'black']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.floatBackButton}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Centered Poster or Fallback */}
          <View style={styles.posterWrapper}>
            {program.poster ? (
              <AnimatedCard style={styles.posterContainer} onPress={() => {}}>
                <Image source={{ uri: program.poster }} style={styles.mainPoster} resizeMode="cover" />
              </AnimatedCard>
            ) : (
              <View style={styles.fallbackContainer}>
                 <LinearGradient
                    colors={['#a78bfa33', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                <Image source={logoSource} style={styles.fallbackLogo} resizeMode="contain" />
              </View>
            )}
            
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.infoContent}>
          <Text style={styles.programTitle}>{program.name}</Text>
          
          {program.host && (
            <View style={styles.hostRow}>
              <Text style={styles.hostLabel}>HOSTED BY</Text>
              <Text style={styles.hostName}>{program.host.toUpperCase()}</Text>
            </View>
          )}

          {program.description && (
            <Text style={styles.programDescription}>{program.description}</Text>
          )}

          {/* Listen Live Button - Premium Action */}
          {isProgramLive && station && (
            <TouchableOpacity
              style={styles.listenLiveButton}
              onPress={() => playStation(station)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#a78bfa', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.listenLiveText}>▶   LISTEN LIVE</Text>
            </TouchableOpacity>
          )}

          {/* Schedule Section */}
          <Text style={styles.sectionHeader}>SCHEDULE</Text>
          {program.schedules && program.schedules.length > 0 ? (
            <View style={styles.scheduleGrid}>
              {program.schedules.map((sch, idx) => (
                <View key={idx} style={styles.scheduleBadge}>
                  <Text style={styles.scheduleDaysBadge}>{sch.days.join(' • ').toUpperCase()}</Text>
                  <Text style={styles.scheduleTimeBadge}>{sch.startTime} - {sch.endTime}</Text>
                </View>
              ))}
            </View>
          ) : (
             <Text style={styles.emptyText}>Full schedule coming soon.</Text>
          )}

          {/* Station Glassmorphism Card */}
          {station && (
            <>
              <Text style={styles.sectionHeader}>AIRING ON</Text>
              <AnimatedCard
                style={styles.stationGlassCard}
                onPress={() => router.push({ pathname: '/station-details', params: { id: station.id } })}
              >
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                <Image source={logoSource} style={styles.miniStationLogo} resizeMode="contain"/>
                <View style={styles.miniStationDetail}>
                  <Text style={styles.miniStationName}>{station.name}</Text>
                  <Text style={styles.miniStationFreq}>{station.frequency || station.city}</Text>
                </View>
                <Text style={styles.miniStationChevron}>›</Text>
              </AnimatedCard>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  heroRoot: {
    height: HERO_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
  },
  heroWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  heroBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBlurBg: {
    width: '100%',
    height: '100%',
  },
  floatBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  posterWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  posterContainer: {
    width: 180,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    backgroundColor: '#1c1c1e',
  },
  mainPoster: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  fallbackLogo: {
    width: '60%',
    height: '60%',
  },
  liveBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 20,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
    opacity: 0.9,
  },
  liveNowText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  infoContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  programTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 5,
  },
  hostRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 25,
  },
  hostLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  hostName: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  programDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  sectionHeader: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 15,
  },
  scheduleGrid: {
    gap: 12,
    marginBottom: 40,
  },
  listenLiveButton: {
    height: 56,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  listenLiveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scheduleBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  scheduleDaysBadge: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  scheduleTimeBadge: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stationGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,250,0.1)',
    width: '100%',
  },
  miniStationLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  miniStationDetail: {
    flex: 1,
    marginLeft: 15,
  },
  miniStationName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  miniStationFreq: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  miniStationChevron: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 24,
    marginLeft: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
    marginBottom: 40,
  },
});
 