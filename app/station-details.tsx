import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useContributions } from '../contexts/ContributionsContext';
import { useData } from '../contexts/DataContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePlayer } from '../contexts/PlayerContext';
import { getCurrentProgram as isLive } from '../utils/timeUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 400;

type AnimatedCardProps = React.PropsWithChildren<{ onPress: () => void; style?: any; [key: string]: any }>;
function AnimatedCard({ children, onPress, ...props }: AnimatedCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
      {...props}
    >
      <Animated.View style={[{ transform: [{ scale }] }, props.style]}>{children}</Animated.View>
    </Pressable>
  );
}

const ProgramCard = React.memo(function ProgramCard({ item, onPress }: { item: any, onPress: () => void }) {
  const live = useMemo(() => isLive([item], item.stationId), [item]);
  return (
    <AnimatedCard style={styles.programCard} onPress={onPress}>
      <Image
        source={item.poster ? { uri: item.poster } : require('../assets/images/favicon.png')}
        style={styles.programPoster}
        resizeMode="cover"
      />
      
      <View style={styles.programInfo}>
        <View style={styles.programNameRow}>
          <Text style={styles.programName} numberOfLines={1}>{item.name}</Text>
          {live && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
          {item.status === 'pending' && (
            <View style={[styles.liveBadge, { backgroundColor: '#fbbf24' }]}>
              <Text style={[styles.liveBadgeText, { color: '#000' }]}>PENDING</Text>
            </View>
          )}
        </View>
        
        {item.schedules && item.schedules[0] && (
          <Text style={styles.programTime}>
            {item.schedules[0].startTime} - {item.schedules[0].endTime}
          </Text>
        )}
        
        {item.host && (
          <Text style={styles.programHost} numberOfLines={1}>
            Host: {item.host}
          </Text>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#52525b" />
    </AnimatedCard>
  );
});

export default function StationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { stations, getProgramsForStation, loading, recordClick, recordProgramClick } = useData();
  const station = stations.find(s => s.id === id);

  React.useEffect(() => {
    if (station) {
      recordClick(station.id);
    }
  }, [station]);
  const { getContributionsForStation } = useContributions();
  const localContributions = useMemo(() => getContributionsForStation(id as string), [id, getContributionsForStation]);

  const stationPrograms = useMemo(() => {
    const staticProgs = getProgramsForStation(id as string);
    return [...localContributions, ...staticProgs];
  }, [id, localContributions, getProgramsForStation]);

  const { favorites, toggleFavorite } = useFavorites();
  const { playerState, playStation, pause } = usePlayer();
  const isStationPlaying = playerState.isPlaying && playerState.currentStation?.id === station?.id;
  const isStationLoading = playerState.isLoading && playerState.currentStation?.id === station?.id;
  const router = useRouter();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#a78bfa" />
      </SafeAreaView>
    );
  }

  if (!station) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButtonInline} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.stationName, { marginTop: 40, textAlign: 'center' }]}>Station not found</Text>
      </SafeAreaView>
    );
  }

  const logoSource = station.logo ? { uri: station.logo.startsWith('http') ? station.logo : `https:${station.logo}` } : require('../assets/images/favicon.png');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Image source={logoSource} style={styles.heroBg} blurRadius={15} resizeMode="cover" />
          <LinearGradient 
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'black']} 
            style={StyleSheet.absoluteFill} 
          />
          
          <View style={styles.heroContent}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <BlurView intensity={30} tint="light" style={styles.backButtonBlur}>
                  <Ionicons name="chevron-back" size={24} color="white" />
                </BlurView>
              </TouchableOpacity>
            </View>

            <View style={styles.stationHeader}>
              <View style={styles.logoRing}>
                <Image source={logoSource} style={styles.stationLogo} resizeMode="contain" />
              </View>
              <View style={styles.stationText}>
                <Text style={styles.stationName}>{station.name}</Text>
                <Text style={styles.stationMeta}>{station.city}, {station.country}</Text>
                <Text style={styles.stationFrequency}>{station.frequency || 'Streaming Live'}</Text>
              </View>
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.mainPlayButton, isStationPlaying && styles.playingButton]}
                onPress={async () => {
                  if (isStationPlaying) await pause();
                  else await playStation(station as any);
                }}
              >
                {!isStationPlaying && (
                  <LinearGradient
                    colors={['#fff', '#f4f4f5']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                {isStationLoading ? (
                  <ActivityIndicator color={isStationPlaying ? "#fff" : "#000"} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons 
                      name={isStationPlaying ? "pause" : "play"} 
                      size={20} 
                      color={isStationPlaying ? "#fff" : "#000"} 
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.playButtonText, { color: isStationPlaying ? "#fff" : "#000" }]}>
                      {isStationPlaying ? 'PAUSE' : 'LISTEN'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.favButtonCircle}
                onPress={() => toggleFavorite(station.id)}
              >
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                <Ionicons 
                  name={favorites.includes(station.id) ? "star" : "star-outline"} 
                  size={24} 
                  color={favorites.includes(station.id) ? "#fbbf24" : "white"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.detailsBody}>
          <View style={styles.tagStrip}>
            {station.tag?.map(t => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.description}>{station.description || 'Welcome to ' + station.name + '. Streaming live from ' + (station.city || 'Haiti') + '.'}</Text>

          <View style={styles.programSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Radio Schedule</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: '/contribute-program', params: { stationId: station.id } })}>
                <Text style={styles.addLink}>+ Suggest Program</Text>
              </TouchableOpacity>
            </View>

            {stationPrograms.length > 0 ? (
              stationPrograms.map(prog => (
                <ProgramCard
                  key={prog.id}
                  item={prog}
                  onPress={() => {
                    recordProgramClick(prog.id);
                    router.push({ pathname: '/program-details', params: { id: prog.id } });
                  }}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No programs listed for this station yet.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  scrollContent: { paddingBottom: 150 },
  heroSection: { height: HERO_HEIGHT, width: '100%' },
  heroBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: HERO_HEIGHT },
  heroContent: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 30,
    justifyContent: 'space-between'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backButtonBlur: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  backButtonInline: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15, 
    marginTop: 40,
    gap: 10
  },
  backButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  stationHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 20,
    marginBottom: 20,
  },
  logoRing: { 
    width: 100, 
    height: 100, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stationLogo: { width: '100%', height: '100%' },
  stationText: { flex: 1 },
  stationName: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  stationMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600', marginTop: 4 },
  stationFrequency: { color: '#a78bfa', fontSize: 14, fontWeight: '700', marginTop: 2 },
  heroActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  mainPlayButton: { 
    flex: 1, 
    backgroundColor: '#fff', 
    height: 56, 
    borderRadius: 16, 
    overflow: 'hidden', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  playingButton: { backgroundColor: '#7c3aed' },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  playButtonText: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  favButtonCircle: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailsBody: { 
    padding: 20, 
    backgroundColor: 'black', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  tagStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#27272a' },
  tagText: { color: '#a1a1aa', fontSize: 13, fontWeight: '600' },
  description: { color: '#d4d4d8', fontSize: 16, lineHeight: 26, marginBottom: 30 },
  programSection: { marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  addLink: { color: '#a78bfa', fontSize: 14, fontWeight: '700' },
  programCard: { flexDirection: 'row', backgroundColor: '#1c1c1e', borderRadius: 20, padding: 12, marginBottom: 12, alignItems: 'center', gap: 15, borderWidth: 1, borderColor: '#27272a' },
  programPoster: { width: 64, height: 64, borderRadius: 12 },
  programInfo: { flex: 1 },
  programNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  programName: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  liveBadge: { backgroundColor: '#7c3aed', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveBadgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  programTime: { color: '#a1a1aa', fontSize: 13, marginTop: 4 },
  programHost: { color: '#71717a', fontSize: 13, marginTop: 2 },
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: '#1c1c1e', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#27272a' },
  emptyText: { color: '#52525b', fontSize: 14, textAlign: 'center' },
});