import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useHistory } from '../../contexts/HistoryContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { programs as allPrograms } from '../../data/programs_updated';
import { stations as allStations } from '../../data/working_stations_2';

const HERO_HEIGHT = 450;
const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 100;
const POSTER_WIDTH = 130;
const POSTER_HEIGHT = 190;
const HERO_ROTATION_INTERVAL = 10000; // 10 seconds
const HERO_MANUAL_TIMEOUT = 30000; // 30 seconds

interface CarouselCardProps {
  item: any;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isStationPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
}

const CarouselCard = React.memo(function CarouselCard({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.thumbCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={item.logo ? { uri: item.logo.startsWith('http') ? item.logo : `https:${item.logo}` } : require('../../assets/images/favicon.png')}
        style={styles.thumbImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
});

interface ProgramCardProps {
  item: any;
  onPress: () => void;
  station?: any;
  rank?: number;
}

const ProgramCard = React.memo(function ProgramCard({ item, onPress, station, rank }: ProgramCardProps) {
  const [imgError, setImgError] = React.useState(false);
  let fallbackSource = require('../../assets/images/favicon.png');
  if (station && station.logo) {
    fallbackSource = { uri: station.logo.startsWith('http') ? station.logo : `https:${station.logo}` };
  }
  return (
    <TouchableOpacity
      style={[styles.thumbCard, rank !== undefined && { marginLeft: 35 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {rank !== undefined && (
        <Text style={styles.rankNumberThumb}>{rank + 1}</Text>
      )}
      <Image
        source={item.poster && !imgError ? { uri: item.poster } : fallbackSource}
        style={styles.thumbImage}
        resizeMode="contain"
        onError={() => setImgError(true)}
      />
    </TouchableOpacity>
  );
});

import { getCurrentProgram } from '../../utils/timeUtils';

export default function HomeScreen() {
  const { favorites, toggleFavorite } = useFavorites();
  const { playerState, playStation, pause } = usePlayer();
  const { history } = useHistory();
  const router = useRouter();
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [selectedHero, setSelectedHero] = useState<any>(null);
  
  const stations = useMemo(() => allStations.filter(s => s.name && s.streamUrl), []);
  const programs = useMemo(() => allPrograms.filter(p => p.name && p.stationId), []);

  const liveNow = useMemo(() => {
    return programs
      .map(p => ({
        program: p,
        station: stations.find(s => s.id === p.stationId),
        isLive: !!getCurrentProgram([p], p.stationId)
      }))
      .filter(item => item.isLive && item.station)
      .slice(0, 10); 
  }, [programs, stations]);

  useEffect(() => {
    if (liveNow.length <= 1 || playerState.isPlaying || selectedHero) return;
    const timer = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % liveNow.length);
    }, HERO_ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, [liveNow.length, playerState.isPlaying, selectedHero]);

  // Handle manual selection timeout (revert to auto-rotation after 30s)
  useEffect(() => {
    if (!selectedHero) return;
    
    const timer = setTimeout(() => {
      setSelectedHero(null);
    }, HERO_MANUAL_TIMEOUT);
    
    return () => clearTimeout(timer);
  }, [selectedHero]);

  const featuredItem = useMemo(() => {
    if (selectedHero) return selectedHero;
    if (playerState.currentStation) {
      const station = stations.find(s => s.id === playerState.currentStation!.id);
      const program = station ? getCurrentProgram(programs, station.id) : undefined;
      return { station, program };
    }
    return liveNow.length > 0 ? liveNow[currentHeroIndex] : { station: stations[0], program: null };
  }, [selectedHero, liveNow, currentHeroIndex, playerState.currentStation, stations, programs]);

  const recentlyPlayed = useMemo(() => {
    return history.map(id => stations.find(s => s.id === id)).filter(Boolean) as any[];
  }, [history, stations]);

  const favoriteStations = useMemo(() => {
    return favorites.map(id => stations.find(s => s.id === id)).filter(Boolean) as any[];
  }, [favorites, stations]);

  const newsStations = useMemo(() => {
    return stations.filter(s => 
      s.tag?.some((t: string) => ['News', 'Talk'].includes(t)) || 
      s.description?.toLowerCase().includes('news')
    ).slice(0, 15);
  }, [stations]);

  const faithStations = useMemo(() => {
    return stations.filter(s => 
      s.description?.toLowerCase().includes('christian') || 
      s.description?.toLowerCase().includes('evangelique') ||
      s.name.toLowerCase().includes('radio 4veh') ||
      s.name.toLowerCase().includes('lumiere')
    ).slice(0, 15);
  }, [stations]);

  const musicStations = useMemo(() => {
    return stations.filter(s => 
      s.tag?.some((t: string) => ['pop', 'Pop', 'Music'].includes(t)) || 
      s.description?.toLowerCase().includes('music') ||
      s.description?.toLowerCase().includes('kompa')
    ).slice(0, 15);
  }, [stations]);

  const justAdded = useMemo(() => stations.slice(-15).reverse(), [stations]);

  const temporalCategory = useMemo(() => {
    const hours = new Date().getHours();
    let title = "Morning Boost";
    let filtered = stations.filter(s => s.description?.toLowerCase().includes('news')).slice(0, 10);

    if (hours >= 11 && hours < 17) {
      title = "Mid-Day Mix";
      filtered = stations.filter(s => s.tag?.includes('pop')).slice(0, 10);
    } else if (hours >= 17 && hours < 23) {
      title = "Evening Vibes";
      filtered = stations.filter(s => s.description?.toLowerCase().includes('entertainment')).slice(0, 10);
    } else if (hours >= 23 || hours < 6) {
      title = "Late Night Radio";
      filtered = stations.filter(s => s.description?.toLowerCase().includes('smooth') || s.tag?.includes('chill')).slice(0, 10);
    }
    return { title, data: filtered };
  }, [stations]);

  const popular = useMemo(() => stations.slice(10, 25), [stations]);
  const trendingShows = useMemo(() => programs.slice(0, 10), [programs]);

  const renderCarouselItem = useCallback(({ item }: { item: any }) => {
    return (
      <CarouselCard
        item={item}
        onPress={() => setSelectedHero({ station: item, program: getCurrentProgram(programs, item.id) })}
      />
    );
  }, [programs]);

  const renderProgramItem = useCallback(({ item, index }: { item: any, index: number }) => {
    const station = stations.find(s => s.id === item.stationId);
    return (
      <ProgramCard
        item={item}
        rank={index}
        onPress={() => setSelectedHero({ station, program: item })}
        station={station}
      />
    );
  }, [stations]);

  const navigateToDetails = useCallback(() => {
    const { station, program } = featuredItem;
    if (program) {
      router.push({ pathname: '/program-details', params: { id: program.id } });
    } else if (station) {
      router.push({ pathname: '/station-details', params: { id: station.id } });
    }
  }, [featuredItem, router]);

  const getTrendingLayout = useCallback((_data: any, index: number) => ({
    length: THUMB_WIDTH + 15,
    offset: (THUMB_WIDTH + 15) * index,
    index,
  }), []);

  const getThumbLayout = useCallback((_data: any, index: number) => ({
    length: THUMB_WIDTH + 12,
    offset: (THUMB_WIDTH + 12) * index,
    index,
  }), []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header} accessibilityRole="header">Rezoa</Text>
      
      {featuredItem.station && (
        <TouchableOpacity 
          style={styles.heroContainer} 
          onPress={navigateToDetails}
          activeOpacity={0.9}
        >
          {/* Background Blurred Layer */}
          <Image
            source={
              featuredItem.program?.poster 
                ? { uri: featuredItem.program.poster } 
                : (featuredItem.station.logo ? { uri: featuredItem.station.logo.startsWith('http') ? featuredItem.station.logo : `https:${featuredItem.station.logo}` } : require('../../assets/images/favicon.png'))
            }
            style={styles.heroImage}
            resizeMode="cover"
          />
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Foreground Contained Layer */}
          <View style={styles.heroForegroundContainer}>
            <Image
              source={
                featuredItem.program?.poster 
                  ? { uri: featuredItem.program.poster } 
                  : (featuredItem.station.logo ? { uri: featuredItem.station.logo.startsWith('http') ? featuredItem.station.logo : `https:${featuredItem.station.logo}` } : require('../../assets/images/favicon.png'))
              }
              style={styles.heroImageForeground}
              resizeMode="contain"
            />
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'black']}
            style={styles.heroGradient}
          />
          
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {featuredItem.program ? featuredItem.program.name : featuredItem.station.name}
            </Text>
            <View style={styles.heroBadges}>
              <View style={[styles.badge, !featuredItem.program && { backgroundColor: '#555' }]}>
                <Text style={styles.badgeText}>
                  {featuredItem.program ? 'LIVE NOW' : 'LIVE RADIO'}
                </Text>
              </View>
              <Text style={styles.heroMeta}>
                {featuredItem.program ? `on ${featuredItem.station.name}` : featuredItem.station.city}
              </Text>
            </View>
            
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.playButtonMain}
                onPress={async () => {
                  const isPlaying = Boolean(playerState.isPlaying && playerState.currentStation && playerState.currentStation.id === featuredItem.station!.id);
                  if (isPlaying) await pause();
                  else await playStation(featuredItem.station!);
                }}
              >
                <Text style={styles.playButtonText}>
                  {Boolean(playerState.isPlaying && playerState.currentStation && playerState.currentStation.id === featuredItem.station!.id) ? '⏸ PAUSE' : '▶️ LISTEN LIVE'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.infoButton} 
                onPress={navigateToDetails}
              >
                <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                <Text style={styles.infoButtonText}>ⓘ MORE INFO</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.favoriteButtonHero} 
                onPress={() => toggleFavorite(featuredItem.station!.id)}
              >
                <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                <Text style={styles.favoriteButtonTextHero}>
                  {favorites.includes(featuredItem.station!.id) ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recentlyPlayed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Jump Back In</Text>
            <FlatList
              data={recentlyPlayed}
              keyExtractor={item => `history-${item.id}`}
              renderItem={renderCarouselItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              getItemLayout={getThumbLayout}
              nestedScrollEnabled={true}
            />
          </>
        )}

        {favoriteStations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Top Mix</Text>
            <FlatList
              data={favoriteStations}
              keyExtractor={item => `fav-${item.id}`}
              renderItem={renderCarouselItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              getItemLayout={getThumbLayout}
              nestedScrollEnabled={true}
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Popular Radios</Text>
        <FlatList
          data={popular}
          keyExtractor={item => `pop-${item.id}`}
          renderItem={renderCarouselItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          getItemLayout={getThumbLayout}
          nestedScrollEnabled={true}
        />

        <Text style={styles.sectionTitle}>Trending Radio Shows</Text>
        <FlatList
          data={trendingShows}
          keyExtractor={item => `trending-${item.id}`}
          renderItem={renderProgramItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          getItemLayout={getTrendingLayout}
          nestedScrollEnabled={true}
        />

        <Text style={styles.sectionTitle}>{temporalCategory.title}</Text>
        <FlatList
          data={temporalCategory.data}
          keyExtractor={item => `temp-${item.id}`}
          renderItem={renderCarouselItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          getItemLayout={getThumbLayout}
          nestedScrollEnabled={true}
        />

        <Text style={styles.sectionTitle}>News & Talk</Text>
        <FlatList
          data={newsStations}
          keyExtractor={item => `news-${item.id}`}
          renderItem={renderCarouselItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          getItemLayout={getThumbLayout}
          nestedScrollEnabled={true}
        />

        <Text style={styles.sectionTitle}>Inspirational & Faith</Text>
        <FlatList
          data={faithStations}
          keyExtractor={item => `faith-${item.id}`}
          renderItem={renderCarouselItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          getItemLayout={getThumbLayout}
          nestedScrollEnabled={true}
        />

        <Text style={styles.sectionTitle}>Global Music Mix</Text>
        <FlatList
          data={musicStations}
          keyExtractor={item => `music-${item.id}`}
          renderItem={renderCarouselItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          getItemLayout={getThumbLayout}
          nestedScrollEnabled={true}
        />

        <Text style={styles.sectionTitle}>Just Added</Text>
        <FlatList
          data={justAdded}
          keyExtractor={item => `new-${item.id}`}
          renderItem={renderCarouselItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          getItemLayout={getThumbLayout}
          nestedScrollEnabled={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    fontSize: 28,
    fontWeight: '900',
    color: '#E50914',
    zIndex: 100,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 170,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroForegroundContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 140,
  },
  heroImageForeground: {
    width: '85%',
    height: '100%',
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroMeta: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  playButtonMain: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  favoriteButtonHero: {
    width: 44,
    height: 44,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonTextHero: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 12,
    marginTop: 25,
  },
  thumbCard: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    padding: 10,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  posterAction: {
    padding: 2,
  },
  rankNumberThumb: {
    position: 'absolute',
    left: -40,
    bottom: -10,
    fontSize: 70,
    fontWeight: '900',
    color: '#000',
    zIndex: -1,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
