import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, InteractionManager, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdBanner from '../../components/AdBanner';
import { useData } from '../../contexts/DataContext';
import { useDrawer } from '../../contexts/DrawerContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useHistory } from '../../contexts/HistoryContext';
import { usePlayer } from '../../contexts/PlayerContext';
import TopNavigation from '../../components/TopNavigation';
import { getCurrentProgram, getHaitiTime } from '../../utils/timeUtils';

const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 100;
const HERO_ROTATION_INTERVAL = 10000;
const HERO_MANUAL_TIMEOUT = 30000;

const CarouselCard = React.memo(function CarouselCard({ item, onPress }: { item: any; onPress: () => void }) {
  const getSafeUri = (uri: any) => {
    if (typeof uri !== 'string' || uri.trim() === '' || uri === 'null' || uri === 'undefined') return null;
    return uri.startsWith('http') ? uri : `https:${uri}`;
  };

  const safeLogo = getSafeUri(item.logo);

  return (
    <TouchableOpacity
      style={styles.thumbCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={safeLogo ? { uri: safeLogo } : require('../../assets/images/app-icon-primary.png')}
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

  const getSafeUri = (uri: any) => {
    if (typeof uri !== 'string' || uri.trim() === '' || uri === 'null' || uri === 'undefined') return null;
    return uri.startsWith('http') ? uri : `https:${uri}`;
  };

  const safeStationLogo = getSafeUri(station?.logo);
  const safePoster = getSafeUri(item.poster);

  const fallbackSource = safeStationLogo ? { uri: safeStationLogo } : require('../../assets/images/app-icon-primary.png');

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
        source={(safePoster && !imgError) ? { uri: safePoster } : fallbackSource}
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
    SplashScreen.hideAsync().catch(() => { });
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

// React.memo prevents re-renders unless HomeScreenContent's own state/context
// values actually change. Since it takes no props, React can freely bail out.
const HomeScreenContent = React.memo(function HomeScreenContent() {
  console.log('--- RENDERING HOME SCREEN CONTENT ---');
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const heroHeight = isLandscape ? screenHeight * 0.7 : screenHeight * 0.45;
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { stations, programs, loading: dataLoading, recordClick, recordProgramClick } = useData();

  useEffect(() => {
    console.log('--- HOME SCREEN CONTENT MOUNTED ---');
  }, []);
  const { favorites, toggleFavorite } = useFavorites();
  const { playStation, playerState, pause } = usePlayer();
  const { history } = useHistory();
  const router = useRouter();

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [selectedHero, setSelectedHero] = useState<any>(null);

  const [categoriesReady, setCategoriesReady] = useState(false);
  const [extraCategoriesReady, setExtraCategoriesReady] = useState(false);

  // Tiered computation: defer secondary category lists until after the initial
  // render and all animations have settled. InteractionManager is the correct
  // tool here — it avoids the forced re-renders that setTimeout causes.
  useEffect(() => {
    // Stage 1: show first-priority categories right after interactions finish
    const task1 = InteractionManager.runAfterInteractions(() => {
      setCategoriesReady(true);
    });
    // Stage 2: defer lower-priority categories by an additional 800ms
    let task2Timer: ReturnType<typeof setTimeout>;
    const task2 = InteractionManager.runAfterInteractions(() => {
      task2Timer = setTimeout(() => setExtraCategoriesReady(true), 800);
    });
    return () => {
      task1.cancel();
      task2.cancel();
      clearTimeout(task2Timer);
    };
  }, []);

  const liveNow = useMemo(() => {
    console.log('--- COMPUTING LIVE NOW ---');
    const nowHaiti = getHaitiTime();
    const stationMap = new Map();
    stations.forEach(s => stationMap.set(s.id, s));

    const result = programs
      .map(p => ({
        program: p,
        station: stationMap.get(p.stationId),
        isLive: !!getCurrentProgram([p], p.stationId, nowHaiti)
      }))
      .filter(item => item.isLive && item.station)
      .slice(0, 10);
    console.log('--- COMPUTING LIVE NOW DONE ---');
    return result;
  }, [programs, stations]);

  useEffect(() => {
    if (!isFocused || liveNow.length <= 1 || playerState.isPlaying || selectedHero) return;
    const timer = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % liveNow.length);
    }, HERO_ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, [isFocused, liveNow.length, playerState.isPlaying, selectedHero]);

  useEffect(() => {
    if (!selectedHero) return;
    const timer = setTimeout(() => {
      setSelectedHero(null);
    }, HERO_MANUAL_TIMEOUT);
    return () => clearTimeout(timer);
  }, [selectedHero]);

  // Use the station ID (a stable string) instead of the currentStation object
  // reference to avoid recomputing this whenever PlayerContext re-renders.
  // We also don't depend on `programs` globally — we look up the current station's
  // programs inline which is much cheaper.
  const currentStationId = playerState.currentStation?.id ?? null;
  const featuredItem = useMemo(() => {
    console.log('--- COMPUTING FEATURED ITEM ---');
    if (selectedHero) return selectedHero;
    if (currentStationId) {
      const station = stations.find(s => s.id === currentStationId);
      const program = station ? getCurrentProgram(programs, station.id) : undefined;
      return { station, program };
    }

    // Safety check: ensure the index is still valid for the current liveNow array
    const safeIndex = currentHeroIndex >= liveNow.length ? 0 : currentHeroIndex;
    if (liveNow.length > 0) return liveNow[safeIndex];

    // Final fallback: If no live now and no stations fetched yet, return null
    if (stations.length === 0) return { station: null, program: null };

    return { station: stations[0], program: null };
  }, [selectedHero, liveNow, currentHeroIndex, currentStationId, stations]);

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
    return stations.filter(s => {
      const hasTag = Array.isArray(s.tag) && s.tag.some((t: string) => t && typeof t === 'string' && ['news', 'talk'].includes(t.toLowerCase()));
      const hasDesc = typeof s.description === 'string' && s.description.toLowerCase().includes('news');
      return hasTag || hasDesc;
    }).slice(0, 15);
  }, [stations, categoriesReady]);

  const faithStations = useMemo(() => {
    if (!extraCategoriesReady) return [];
    return stations.filter(s => {
      const desc = typeof s.description === 'string' ? s.description.toLowerCase() : '';
      const name = typeof s.name === 'string' ? s.name.toLowerCase() : '';
      return desc.includes('christian') ||
        desc.includes('evangelique') ||
        name.includes('radio 4veh') ||
        name.includes('lumiere');
    }).slice(0, 15);
  }, [stations, extraCategoriesReady]);

  const musicStations = useMemo(() => {
    if (!extraCategoriesReady) return [];
    return stations.filter(s => {
      const hasTag = Array.isArray(s.tag) && s.tag.some((t: string) => t && typeof t === 'string' && ['pop', 'music'].includes(t.toLowerCase()));
      const desc = typeof s.description === 'string' ? s.description.toLowerCase() : '';
      return hasTag || desc.includes('music') || desc.includes('kompa');
    }).slice(0, 15);
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
    let filtered = stations.filter(s => typeof s.description === 'string' && s.description.toLowerCase().includes('news')).slice(0, 10);

    if (hours >= 11 && hours < 17) {
      title = "Mid-Day Mix";
      filtered = stations.filter(s => Array.isArray(s.tag) && s.tag.some(t => typeof t === 'string' && t.toLowerCase().includes('pop'))).slice(0, 10);
    } else if (hours >= 17 && hours < 23) {
      title = "Evening Vibes";
      filtered = stations.filter(s => typeof s.description === 'string' && s.description.toLowerCase().includes('entertainment')).slice(0, 10);
    } else if (hours >= 23 || hours < 6) {
      title = "Late Night Radio";
      filtered = stations.filter(s =>
        (typeof s.description === 'string' && s.description.toLowerCase().includes('smooth')) ||
        (Array.isArray(s.tag) && s.tag.some(t => typeof t === 'string' && t.toLowerCase().includes('chill')))
      ).slice(0, 10);
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
          router.push({ pathname: '/station-details', params: { id: item.id } });
        }}
      />
    );
  }, [recordClick, router]);

  const renderProgramItem = useCallback(({ item, index }: { item: any, index: number }) => {
    const station = stations.find(s => s.id === item.stationId);
    return (
      <ProgramCard
        item={item}
        rank={index}
        onPress={() => {
          recordProgramClick(item.id);
          router.push({ pathname: '/program-details', params: { id: item.id } });
        }}
        station={station}
      />
    );
  }, [stations, recordProgramClick, router]);

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
    <View style={styles.container}>
      <TopNavigation />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150, paddingTop: isLandscape ? insets.top : insets.top + 60, paddingRight: isLandscape ? Math.max(0, insets.right) : 0 }}
        style={isLandscape ? { marginLeft: 200 + Math.max(0, insets.left) } : {}}
      >
        {featuredItem?.station && (
          <TouchableOpacity
            style={[styles.heroContainer, { height: heroHeight }]}
            onPress={navigateToDetails}
            activeOpacity={0.9}
          >
            <Image
              source={
                (featuredItem.program?.poster && featuredItem.program.poster.trim() !== '')
                  ? { uri: featuredItem.program.poster.startsWith('http') ? featuredItem.program.poster : `https:${featuredItem.program.poster}` }
                  : (featuredItem.station?.logo && featuredItem.station.logo.trim() !== ''
                    ? { uri: featuredItem.station.logo.startsWith('http') ? featuredItem.station.logo : `https:${featuredItem.station.logo}` }
                    : require('../../assets/images/app-icon-primary.png'))
              }
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />

            <View style={styles.heroForegroundContainer}>
              <Image
                source={
                  (featuredItem.program?.poster && featuredItem.program.poster.trim() !== '')
                    ? { uri: featuredItem.program.poster.startsWith('http') ? featuredItem.program.poster : `https:${featuredItem.program.poster}` }
                    : (featuredItem.station?.logo && featuredItem.station.logo.trim() !== ''
                      ? { uri: featuredItem.station.logo.startsWith('http') ? featuredItem.station.logo : `https:${featuredItem.station.logo}` }
                      : require('../../assets/images/app-icon-primary.png'))
                }
                style={styles.heroImageForeground}
                resizeMode="contain"
              />
            </View>

            <View style={[styles.heroGradient, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {featuredItem.program ? featuredItem.program.name : (featuredItem.station?.name || 'Unknown')}
              </Text>
              <View style={styles.heroBadges}>
                <View style={[styles.badge, !featuredItem.program && { backgroundColor: '#555' }]}>
                  <Text style={styles.badgeText}>
                    {featuredItem.program ? 'LIVE NOW' : 'LIVE RADIO'}
                  </Text>
                </View>
                <Text style={styles.heroMeta}>
                  {featuredItem.program ? `on ${featuredItem.station?.name || 'Radio'}` : ([featuredItem.station?.city, featuredItem.station?.department, featuredItem.station?.country].filter(Boolean).join(', ') || 'Haiti')}
                </Text>
              </View>

              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.playButtonMain}
                  onPress={async () => {
                    if (!featuredItem.station) return;
                    const isPlaying = Boolean(playerState.isPlaying && playerState.currentStation && playerState.currentStation.id === featuredItem.station.id);
                    if (isPlaying) await pause();
                    else await playStation(featuredItem.station);
                  }}
                >
                  <Text style={styles.playButtonText}>
                    {Boolean(playerState.isPlaying && playerState.currentStation && featuredItem.station && playerState.currentStation.id === featuredItem.station.id) ? '⏸ PAUSE' : '▶️ LISTEN LIVE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={navigateToDetails}
                >
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                  <Text style={styles.infoButtonText}>ⓘ MORE INFO</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.favoriteButtonHero}
                  onPress={() => {
                    if (featuredItem.station) toggleFavorite(featuredItem.station.id);
                  }}
                >
                  <Ionicons
                    name={featuredItem.station && favorites.includes(featuredItem.station.id) ? 'heart' : 'heart-outline'}
                    size={24}
                    color={featuredItem.station && favorites.includes(featuredItem.station.id) ? '#ef4444' : '#fff'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}

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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
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
    backgroundColor: '#ef4444',
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
    padding: 4,
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
