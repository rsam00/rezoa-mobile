import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdBanner from '../../components/AdBanner';
import { useData } from '../../contexts/DataContext';
import { useDrawer } from '../../contexts/DrawerContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { usePlayer } from '../../contexts/PlayerContext';
import TopNavigation from '../../components/TopNavigation';

const CARD_GAP = 12;

const StationCard = React.memo(function StationCard({ item, isFavorite, isStationPlaying, isLoading, onPress, onToggleFavorite, onPlayPause, cardWidth }: any) {
  const [imgError, setImgError] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.cardContainer, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.imageContainer, { height: cardWidth * 0.85 }]}>
        <Image
          source={imgError ? require('../../assets/images/app-icon-primary.png') : (item.logo ? { uri: item.logo.startsWith('http') ? item.logo : `https:${item.logo}` } : require('../../assets/images/app-icon-primary.png'))}
          style={styles.stationLogo}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />

        {/* Favorite Button (Top Right) */}
        <TouchableOpacity
          style={styles.floatingHeart}
          onPress={onToggleFavorite}
          activeOpacity={0.7}
        >
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#ef4444" : "#fff"} />
        </TouchableOpacity>

        {/* Play Button Overlay (Bottom Right of Image) */}
        <TouchableOpacity
          style={styles.floatingPlay}
          onPress={onPlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name={isStationPlaying ? "pause" : "play"} size={16} color="#fff" style={{ marginLeft: isStationPlaying ? 0 : 2 }} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{[item.city, item.department, item.country].filter(Boolean).join(', ')}</Text>
        {item.frequency && <Text style={styles.cardMeta}>{item.frequency}</Text>}
      </View>
    </TouchableOpacity>
  );
});

export default function ExploreScreen() {
  return <ExploreScreenContent />;
}

function ExploreScreenContent() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const numColumns = isLandscape ? 4 : 2;
  const availableWidth = isLandscape ? screenWidth - (200 + Math.max(0, insets.left)) : screenWidth;
  const cardWidth = (availableWidth - (30 + (numColumns - 1) * CARD_GAP)) / numColumns;
  const { stations, loading: dataLoading } = useData();
  const { favorites, toggleFavorite } = useFavorites();
  const { playerState, playStation, pause } = usePlayer();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filteredStations = useMemo(() => {
    if (!search.trim()) return stations;
    const q = search.trim().toLowerCase();
    return stations.filter((s: any) =>
      s.name.toLowerCase().includes(q) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.country && s.country.toLowerCase().includes(q)) ||
      (s.tag && s.tag.some((t: string) => t.toLowerCase().includes(q)))
    );
  }, [search, stations]);

  const exploreData = useMemo(() => {
    const data: any[] = [];
    const rows: any[] = [];

    // Group into dynamic rows
    for (let i = 0; i < filteredStations.length; i += numColumns) {
      rows.push(filteredStations.slice(i, i + numColumns));
    }

    // Insert ad every 3 rows
    rows.forEach((row, index) => {
      if (index > 0 && index % 3 === 0) {
        data.push({ id: `ad-${index}`, isAd: true });
      }
      data.push({ id: `row-${index}`, items: row });
    });

    return data;
  }, [filteredStations, numColumns]);

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  const renderExploreItem = useCallback(({ item }: any) => {
    if (item.isAd) {
      return (
        <View style={{ paddingHorizontal: 15, marginVertical: 10, marginBottom: 16 }}>
          <AdBanner />
        </View>
      );
    }

    return (
      <View style={{ flexDirection: 'row', paddingHorizontal: 15, gap: CARD_GAP, marginBottom: 16 }}>
        {item.items.map((station: any) => {
          const isFavorite = favorites.includes(station.id);
          const isStationPlaying = playerState.isPlaying && playerState.currentStation?.id === station.id;
          const isLoading = playerState.isLoading && playerState.currentStation?.id === station.id;

          const handlePlayPause = async () => {
            if (isStationPlaying) await pause();
            else await playStation(station as any);
          };

          return (
            <StationCard
              key={station.id}
              item={station}
              cardWidth={cardWidth}
              isFavorite={isFavorite}
              isStationPlaying={isStationPlaying}
              isLoading={isLoading}
              onPress={() => router.push({ pathname: '/station-details', params: { id: station.id } })}
              onToggleFavorite={() => handleToggleFavorite(station.id)}
              onPlayPause={handlePlayPause}
            />
          );
        })}
        {item.items.length < numColumns && 
          Array.from({ length: numColumns - item.items.length }).map((_, idx) => (
             <View key={`spacer-${idx}`} style={{ width: cardWidth }} />
          ))
        }
      </View>
    );
  }, [favorites, playerState, router, handleToggleFavorite, pause, playStation]);

  const getItemLayout = useCallback((_data: any, index: number) => {
    return {
      length: cardWidth + CARD_GAP,
      offset: (cardWidth + CARD_GAP) * index,
      index,
    };
  }, [cardWidth]);

  if (dataLoading) {
    return (
      <View style={[styles.container, { paddingTop: isLandscape ? insets.top + 10 : insets.top + 70 }, isLandscape ? { marginLeft: 200 + Math.max(0, insets.left) } : {}]}>
        <ActivityIndicator size="large" color="#a78bfa" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopNavigation />
      <FlatList
        style={isLandscape ? { marginLeft: 200 + Math.max(0, insets.left) } : {}}
        ListHeaderComponent={(
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder="Find your sound..."
              placeholderTextColor="#a1a1aa"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            <Ionicons name="search" size={20} color="#a78bfa" style={styles.searchIcon} />
          </View>
        )}
        data={exploreData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: isLandscape ? insets.top : insets.top + 60, paddingBottom: 100, paddingRight: isLandscape ? Math.max(0, insets.right) : 0 }}
        renderItem={renderExploreItem}
        initialNumToRender={6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 15,
    marginBottom: 20,
    height: 50,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchBar: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  cardContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stationLogo: {
    width: '60%',
    height: '60%',
  },
  floatingHeart: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  floatingPlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#a78bfa',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  infoContainer: {
    padding: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    marginBottom: 2,
  },
  cardMeta: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
