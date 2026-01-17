import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFavorites } from '../../contexts/FavoritesContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { stations as allStations } from '../../data/working_stations_2';

const CARD_GAP = 16;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (Dimensions.get('window').width - CARD_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

type Station = {
  id: string;
  name: string;
  logo?: string;
  streamUrl: string;
  website?: string;
  city?: string;
  country?: string;
  language?: string;
  description?: string;
  frequency?: string;
  tag?: string[];
};

type StationCardProps = {
  item: Station;
  isFavorite: boolean;
  isStationPlaying: boolean;
  isLoading: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  onPlayPause: () => void;
};

const StationCard = React.memo(function StationCard({ item, isFavorite, isStationPlaying, isLoading, onPress, onToggleFavorite, onPlayPause }: StationCardProps) {
  const [imgError, setImgError] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.cardGrid, isStationPlaying && styles.playingCard]}
      onPress={onPress}
      accessibilityLabel={`Open details for ${item.name}`}
      accessibilityHint="Double tap to view station details"
      accessible={true}
      activeOpacity={0.85}
    >
      <View style={styles.logoContainer}>
        <Image
          source={imgError ? require('../../assets/images/favicon.png') : (item.logo ? { uri: item.logo.startsWith('http') ? item.logo : `https:${item.logo}` } : require('../../assets/images/favicon.png'))}
          style={styles.logoLarge}
          resizeMode="contain"
          accessibilityLabel={item.name + ' logo'}
          accessible={true}
          onError={() => setImgError(true)}
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.city} numberOfLines={1}>{item.city}, {item.country}</Text>
      <Text style={styles.frequency}>{item.frequency}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <TouchableOpacity
          onPress={onToggleFavorite}
          style={styles.favoriteButton}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
          accessibilityHint="Double tap to toggle favorite"
          accessible={true}
        >
          <Text style={{ color: '#a78bfa', fontSize: 20 }}>
            {isFavorite ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onPlayPause}
          style={styles.playButton}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? `Loading ${item.name}` : isStationPlaying ? `Pause ${item.name}` : `Play ${item.name}`}
          accessibilityHint="Double tap to play or pause the station"
          accessible={true}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#a78bfa" />
          ) : (
            <Text style={{ color: '#a78bfa', fontSize: 20 }}>
              {isStationPlaying ? '⏸' : '▶️'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default function ExploreScreen() {
  const { favorites, toggleFavorite } = useFavorites();
  const { playerState, playStation, pause } = usePlayer();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [search, setSearch] = useState('');
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);

  useEffect(() => {
    try {
      const all = allStations.filter(s => s.name && s.streamUrl);
      setStations(all);
      setFilteredStations(all);
      setLoading(false);
    } catch (e) {
      setError('Failed to load stations.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!search.trim()) {
        setFilteredStations(stations);
      } else {
        const q = search.trim().toLowerCase();
        setFilteredStations(
          stations.filter(
            s =>
              s.name.toLowerCase().includes(q) ||
              (s.city && s.city.toLowerCase().includes(q)) ||
              (s.country && s.country.toLowerCase().includes(q))
          )
        );
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [search, stations]);

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  const renderItem = useCallback(({ item }: { item: Station }) => {
    const isFavorite = favorites.includes(item.id);
    const isStationPlaying = playerState.isPlaying && playerState.currentStation?.id === item.id;
    const isLoading = playerState.isLoading && playerState.currentStation?.id === item.id;
    
    const handlePlayPause = async () => {
      if (isStationPlaying) {
        await pause();
      } else {
        await playStation(item);
      }
    };

    return (
      <StationCard
        item={item}
        isFavorite={isFavorite}
        isStationPlaying={isStationPlaying}
        isLoading={isLoading}
        onPress={() => router.push({ pathname: '/station-details', params: { id: item.id } })}
        onToggleFavorite={() => handleToggleFavorite(item.id)}
        onPlayPause={handlePlayPause}
      />
    );
  }, [favorites, playerState, router, handleToggleFavorite, pause, playStation]);

  const getItemLayout = useCallback((data: ArrayLike<Station> | null | undefined, index: number) => {
    return {
      length: CARD_WIDTH + CARD_GAP,
      offset: (CARD_WIDTH + CARD_GAP) * index,
      index,
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#a78bfa" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: 'red', marginTop: 40 }}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} accessible={true} accessibilityLabel="Explore screen with list of radio stations">
      <Text style={styles.header} accessibilityRole="header">Explore</Text>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#a78bfa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Find your sound..."
          placeholderTextColor="#a1a1aa"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search radio stations"
          accessible={true}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        key={'grid-2'}
        data={filteredStations}
        keyExtractor={(item: Station) => item.id}
        numColumns={NUM_COLUMNS}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, gap: CARD_GAP }}
        columnWrapperStyle={{ gap: CARD_GAP }}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 8,
    paddingTop: 80,
    paddingBottom: 160, // Account for tab bar height + Integrated Player Bar
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginBottom: 16,
    marginLeft: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchBar: {
    flex: 1,
    color: '#fff',
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  cardGrid: {
    flex: 1,
    minWidth: 0,
    maxWidth: '48%',
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 0,
  },
  playingCard: {
    borderColor: '#34d399',
    borderWidth: 2,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#222',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoLarge: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  name: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  city: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 2,
  },
  frequency: {
    fontSize: 13,
    color: '#fbbf24',
    marginTop: 2,
  },
  tag: {
    backgroundColor: '#a78bfa33',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  tagText: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '500',
  },
  favoriteButton: {
    marginLeft: 8,
    padding: 8,
  },
  playButton: {
    marginLeft: 4,
    padding: 8,
  },
});
