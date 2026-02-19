import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdBanner from '../../components/AdBanner';
import { useData } from '../../contexts/DataContext';
import { useDrawer } from '../../contexts/DrawerContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useHistory } from '../../contexts/HistoryContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { getCurrentProgram } from '../../utils/timeUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.3;
const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 100;
const HERO_ROTATION_INTERVAL = 10000;
const HERO_MANUAL_TIMEOUT = 30000;

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
      style={styles.thumbCard}
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

export default function HomeScreen() {
  const { isReady } = useData();

  useEffect(() => {
    // Hide native splash screen once the JS Home Screen mounts/renders
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2e1065', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 20, fontWeight: 'bold' }}>SYNCHRONIZING REZOA...</Text>
      </View>
    );
  }

  return <HomeScreenContent />;
}

function HomeScreenContent() {
  const insets = useSafeAreaInsets();
  const { stations, programs, loading: dataLoading, recordClick, recordProgramClick } = useData();



  useEffect(() => {
    // No-op
  }, []);
  const { favorites, toggleFavorite } = useFavorites();
  const { playerState, playStation, pause } = usePlayer();
  const { history } = useHistory();
  const { openDrawer } = useDrawer();
  const router = useRouter();

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [selectedHero, setSelectedHero] = useState<any>(null);
  
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [extraCategoriesReady, setExtraCategoriesReady] = useState(false);

  // Tiered computation: Stage 1 for the first few rows, Stage 2 for everything else
  useEffect(() => {
    const t1 = setTimeout(() => setCategoriesReady(true), 100);
    const t2 = setTimeout(() => setExtraCategoriesReady(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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
    
    // Safety check: ensure the index is still valid for the current liveNow array
    const safeIndex = currentHeroIndex >= liveNow.length ? 0 : currentHeroIndex;
    if (liveNow.length > 0) return liveNow[safeIndex];
    
    // Final fallback: If no live now and no stations fetched yet, return null
    if (stations.length === 0) return { station: null, program: null };
    
    return { station: stations[0], program: null };
  }, [selectedHero, liveNow, currentHeroIndex, playerState.currentStation, stations, programs]);

  // Only calculate these once the screen has finished its first "Hero" render
  const recentlyPlayed = useMemo(() => {
    if (!categoriesReady) return [];
    return history.map(id => stations.find(s => s.id === id)).filter(Boolean) as any[];
  }, [history, stations, categoriesReady]);

  const favoriteStations = useMemo(() => {
    if (!categoriesReady) return [];
    return favorites.map(id => stations.find(s => s.id === id)).filter(Boolean) as any[];
  }, [favorites, stations, categoriesReady]);

  const newsStations = useMemo(() => {
    if (!categoriesReady) return [];
    return stations.filter(s => 
      s.tag?.some((t: string) => ['News', 'Talk', 'news'].includes(t.toLowerCase())) || 
      s.description?.toLowerCase().includes('news')
    ).slice(0, 15);
  }, [stations, categoriesReady]);

  const faithStations = useMemo(() => {
    if (!extraCategoriesReady) return [];
    return stations.filter(s => 
      s.description?.toLowerCase().includes('christian') || 
      s.description?.toLowerCase().includes('evangelique') ||
      s.name.toLowerCase().includes('radio 4veh') ||
      s.name.toLowerCase().includes('lumiere')
    ).slice(0, 15);
  }, [stations, extraCategoriesReady]);

  const musicStations = useMemo(() => {
    if (!extraCategoriesReady) return [];
    return stations.filter(s => 
      s.tag?.some((t: string) => ['pop', 'Music', 'music'].includes(t.toLowerCase())) || 
      s.description?.toLowerCase().includes('music') ||
      s.description?.toLowerCase().includes('kompa')
    ).slice(0, 15);
  }, [stations, extraCategoriesReady]);

  const justAdded = useMemo(() => {
    if (!extraCategoriesReady) return [];
    return [...stations].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    ).slice(0, 15);
  }, [stations, extraCategoriesReady]);

  const temporalCategory = useMemo(() => {
    const hours = new Date().getHours();
    let title = "Morning Boost";
    let filtered = stations.filter(s => s.description?.toLowerCase().includes('news')).slice(0, 10);

    if (hours >= 11 && hours < 17) {
      title = "Mid-Day Mix";
      filtered = stations.filter(s => s.tag?.some(t => t.toLowerCase().includes('pop'))).slice(0, 10);
    } else if (hours >= 17 && hours < 23) {
      title = "Evening Vibes";
      filtered = stations.filter(s => s.description?.toLowerCase().includes('entertainment')).slice(0, 10);
    } else if (hours >= 23 || hours < 6) {
      title = "Late Night Radio";
      filtered = stations.filter(s => s.description?.toLowerCase().includes('smooth') || s.tag?.some(t => t.toLowerCase().includes('chill'))).slice(0, 10);
    }
    return { title, data: filtered };
  }, [stations, categoriesReady]);

  const popular = useMemo(() => {
    if (!extraCategoriesReady) return [];
    return [...stations].sort((a, b) => 
      (b.favoriteCount || 0) - (a.favoriteCount || 0)
    ).slice(0, 15);
  }, [stations, extraCategoriesReady]);

  const trendingShows = useMemo(() => {
    if (!extraCategoriesReady) return [];
    return [...programs].sort((a, b) => 
      (b.clickCount || 0) - (a.clickCount || 0)
    ).slice(0, 15);
  }, [programs, extraCategoriesReady]);

  const renderCarouselItem = useCallback(({ item }: { item: any }) => {
    return (
      <CarouselCard
        item={item}
        onPress={() => {
          recordClick(item.id);
          setSelectedHero({ station: item, program: getCurrentProgram(programs, item.id) });
        }}
      />
    );
  }, [programs, recordClick]);

  const renderProgramItem = useCallback(({ item, index }: { item: any, index: number }) => {
    const station = stations.find(s => s.id === item.stationId);
    return (
      <ProgramCard
        item={item}
        rank={index}
        onPress={() => {
          recordProgramClick(item.id);
          setSelectedHero({ station, program: item });
        }}
        station={station}
      />
    );
  }, [stations, recordProgramClick]);

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={openDrawer}
        >
          <Text style={styles.profileButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={{ width: 44 }} />
      </View>
      
      {featuredItem?.station && (
        <TouchableOpacity 
          style={styles.heroContainer} 
          onPress={navigateToDetails}
          activeOpacity={0.9}
        >
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
                <Ionicons 
                  name={favorites.includes(featuredItem.station!.id) ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={favorites.includes(featuredItem.station!.id) ? '#a78bfa' : '#fff'} 
                />
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
        <View style={{ paddingHorizontal: 15, marginVertical: 15 }}>
          <AdBanner />
        </View>

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
          contentContainerStyle={{ paddingHorizontal: 15 }}
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

        <View style={{ paddingHorizontal: 15, marginVertical: 15 }}>
          <AdBanner />
        </View>

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

        <View style={{ paddingHorizontal: 15, marginVertical: 15 }}>
          <AdBanner />
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  headerRow: {
    paddingTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
    backgroundColor: 'black',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#a78bfa',
  },
  profileButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  profileButtonText: {
    color: '#a78bfa',
    fontSize: 28,
    fontWeight: '700',
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
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
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
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#a78bfa',
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
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  playButtonMain: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  playButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  favoriteButtonHero: {
    width: 36,
    height: 36,
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
  rankNumberThumb: {
    position: 'absolute',
    left: 4,
    bottom: -14,
    fontSize: 70,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.15)',
    zIndex: -1,
  },
});
