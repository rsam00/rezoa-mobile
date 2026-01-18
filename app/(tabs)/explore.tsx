import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AdBanner from '../../components/AdBanner';
import { useData } from '../../contexts/DataContext';
import { useDrawer } from '../../contexts/DrawerContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { usePlayer } from '../../contexts/PlayerContext';

const CARD_GAP = 12;
const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - (30 + CARD_GAP)) / 2; // 30 = paddingHorizontal * 2

const StationCard = React.memo(function StationCard({ item, isFavorite, isStationPlaying, isLoading, onPress, onToggleFavorite, onPlayPause }: any) {
  const [imgError, setImgError] = useState(false);
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imgError ? require('../../assets/images/favicon.png') : (item.logo ? { uri: item.logo.startsWith('http') ? item.logo : `https:${item.logo}` } : require('../../assets/images/favicon.png'))}
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
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? "#a78bfa" : "#fff"} />
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
             <Ionicons name={isStationPlaying ? "pause" : "play"} size={20} color="#fff" style={{ marginLeft: isStationPlaying ? 0 : 2 }} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.city}</Text>
        {item.frequency && <Text style={styles.cardMeta}>{item.frequency}</Text>}
      </View>
    </TouchableOpacity>
  );
});

export default function ExploreScreen() {
  return <ExploreScreenContent />;
}

function ExploreScreenContent() {
  const { stations, loading: dataLoading } = useData();
  const { favorites, toggleFavorite } = useFavorites();
  const { openDrawer } = useDrawer();
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
    
    // Group into pairs
    for (let i = 0; i < filteredStations.length; i += 2) {
      rows.push(filteredStations.slice(i, i + 2));
    }

    // Insert ad every 3 rows
    rows.forEach((row, index) => {
      if (index > 0 && index % 3 === 0) {
        data.push({ id: `ad-${index}`, isAd: true });
      }
      data.push({ id: `row-${index}`, items: row });
    });

    return data;
  }, [filteredStations]);

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
              isFavorite={isFavorite}
              isStationPlaying={isStationPlaying}
              isLoading={isLoading}
              onPress={() => router.push({ pathname: '/station-details', params: { id: station.id } })}
              onToggleFavorite={() => handleToggleFavorite(station.id)}
              onPlayPause={handlePlayPause}
            />
          );
        })}
        {item.items.length === 1 && <View style={{ width: CARD_WIDTH }} />}
      </View>
    );
  }, [favorites, playerState, router, handleToggleFavorite, pause, playStation]);

  const getItemLayout = useCallback((_data: any, index: number) => {
    return {
      length: CARD_WIDTH + CARD_GAP,
      offset: (CARD_WIDTH + CARD_GAP) * index,
      index,
    };
  }, []);

  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#a78bfa" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={openDrawer}
        >
          <Text style={styles.profileButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Explore</Text>
        <View style={{ width: 44 }} />
      </View>
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
      <FlatList
        data={exploreData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 170 }}
        renderItem={renderExploreItem}
        initialNumToRender={6}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  headerRow: {
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
    backgroundColor: 'black',
    marginBottom: 10,
  },
  header: {
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
    width: CARD_WIDTH,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    height: CARD_WIDTH * 0.85, 
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
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingPlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#a78bfa',
    borderRadius: 20,
    width: 36,
    height: 36,
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
