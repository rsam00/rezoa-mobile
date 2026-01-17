import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePlayer } from '../contexts/PlayerContext';
import { programs as allPrograms } from '../data/programs_updated';
import { stations as allStations } from '../data/working_stations_2';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 280;

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

import { getCurrentProgram as isLive } from '../utils/timeUtils';

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
      
      <Text style={styles.chevron}>›</Text>
    </AnimatedCard>
  );
});

export default function StationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const station = allStations.find(s => s.id === id);
  const stationPrograms = useMemo(() => allPrograms.filter(p => p.stationId === id), [id]);
  const { favorites, toggleFavorite } = useFavorites();
  const { playerState, playStation, pause } = usePlayer();
  const isStationPlaying = playerState.isPlaying && playerState.currentStation?.id === station?.id;
  const isLoading = playerState.isLoading && playerState.currentStation?.id === station?.id;
  const router = useRouter();

  if (!station) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.stationName}>Station not found</Text>
      </SafeAreaView>
    );
  }

  const logoSource = station.logo ? { uri: station.logo.startsWith('http') ? station.logo : `https:${station.logo}` } : require('../assets/images/favicon.png');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* Header Layer */}
        <View style={styles.heroRoot}>
          <View style={styles.heroWrapper}>
            <View style={styles.heroBackgroundContainer}>
              <Image source={logoSource} style={styles.heroBlurBg} resizeMode="cover" />
              <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,1)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.floatBackButton}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.heroLogoWrapper}>
            <View style={styles.heroLogoContainer}>
              <Image source={logoSource} style={styles.heroLogo} resizeMode="contain" />
            </View>
          </View>
        </View>

        {/* Station Info Section */}
        <View style={styles.contentPadding}>
          <View style={styles.infoRow}>
            <Text style={styles.stationName}>{station.name}</Text>
          </View>
          
          <Text style={styles.stationMeta}>
            {station.city}, {station.country}  •  <Text style={styles.frequencyText}>{station.frequency || 'Streaming Live'}</Text>
          </Text>

          <View style={styles.tagGrid}>
            {(station.tag || []).map((tag: string) => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.descriptionText}>{station.description}</Text>

          {/* Contact Information Section - Enriched Data */}
          {((station as any).phone || (station as any).email || (station as any).facebook || (station as any).twitter || station.website) && (
            <View style={styles.contactContainer}>
               <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
               <View style={styles.contactGrid}>
                  {(station as any).phone && (
                    <View style={styles.contactItem}>
                      <Text style={styles.contactLabel}>PHONE</Text>
                      <Text style={styles.contactValue}>{(station as any).phone}</Text>
                    </View>
                  )}
                  {(station as any).email && (
                    <View style={styles.contactItem}>
                      <Text style={styles.contactLabel}>EMAIL</Text>
                      <Text style={styles.contactValue} numberOfLines={1}>{(station as any).email.toLowerCase()}</Text>
                    </View>
                  )}
                  {station.website && (
                    <TouchableOpacity style={styles.contactItem} onPress={() => {}}>
                      <Text style={styles.contactLabel}>WEBSITE</Text>
                      <Text style={styles.contactValue} numberOfLines={1}>Visit Site</Text>
                    </TouchableOpacity>
                  )}
                  {((station as any).facebook || (station as any).twitter) && (
                    <View style={styles.contactItem}>
                      <Text style={styles.contactLabel}>SOCIAL</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                        {(station as any).facebook && <Text style={styles.contactValue}>FB</Text>}
                        {(station as any).twitter && <Text style={styles.contactValue}>TW</Text>}
                      </View>
                    </View>
                  )}
               </View>
            </View>
          )}

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={async () => isStationPlaying ? await pause() : await playStation(station)}
              style={[styles.playButtonMain, isStationPlaying && styles.playButtonActive]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.playButtonText}>
                  {isStationPlaying ? '⏸ PAUSE' : '▶️ LISTEN LIVE'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.favoriteButton} 
              onPress={() => toggleFavorite(station.id)}
            >
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.favoriteIcon}>
                {favorites.includes(station.id) ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Programs Section */}
          <Text style={styles.sectionHeader}>PROGRAMS & SCHEDULE</Text>
          <FlatList
            key="program-list-v2"
            data={stationPrograms}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <ProgramCard
                item={item}
                onPress={() => router.push({ pathname: '/program-details', params: { id: item.id } })}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Full schedule coming soon.</Text>
            }
          />
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
    zIndex: 10,
  },
  heroWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  heroBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBlurBg: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  floatBackButton: {
    position: 'absolute',
    top: 40,
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
  heroLogoWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 20,
  },
  heroLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    marginBottom: -40, 
  },
  heroLogo: {
    width: '100%',
    height: '100%',
  },
  contentPadding: {
    paddingHorizontal: 20,
    paddingTop: 50, // Higher padding to accommodate the overlapping logo
    paddingBottom: 100,
  },
  infoRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  stationName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  stationMeta: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '500',
  },
  frequencyText: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
    gap: 8,
  },
  tagBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  tagText: {
    color: '#a78bfa',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  descriptionText: {
    color: '#d4d4d8',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 20,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 25,
    marginBottom: 30,
    gap: 12,
  },
  playButtonMain: {
    flex: 1,
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: '#a78bfa',
  },
  playButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
  favoriteButton: {
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    color: '#fff',
    fontSize: 24,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 15,
    marginTop: 10,
  },
  programCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    marginBottom: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  programPoster: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  programInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  programNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  programName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  liveBadge: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  programTime: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '500',
  },
  programHost: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 1,
  },
  chevron: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 24,
    marginLeft: 10,
  },
  emptyText: {
    color: '#52525b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  contactContainer: {
    marginTop: 30,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 20,
  },
  contactItem: {
    width: '45%',
  },
  contactLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  contactValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});