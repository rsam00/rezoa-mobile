import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue
} from 'react-native-reanimated';
import AdBanner from '../../components/AdBanner';
import { useData } from '../../contexts/DataContext';
import { useDrawer } from '../../contexts/DrawerContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { getHaitiTime } from '../../utils/timeUtils';

const ReanimatedFlatList = Animated.createAnimatedComponent(FlatList);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_WIDTH = 120;
const STATION_ROW_HEIGHT = 90;
const TIME_ROW_HEIGHT = 45;
const LEFT_COLUMN_WIDTH = 100;

interface Station {
  id: string;
  name: string;
  logo?: string;
  streamUrl: string;
  city?: string;
  tag?: string[];
}

interface Program {
  id: string;
  stationId: string;
  name: string;
  host?: string;
  schedules: { startTime: string; endTime: string; days: string[] }[];
}

interface ProgramBlock {
  program: Program;
  startMinute: number;
  endMinute: number;
  duration: number;
  isCurrent: boolean;
}

function getBlocksForDay(programs: Program[], dayName: string) {
  const normDay = dayName.toLowerCase().slice(0, 3);
  const blocks: ProgramBlock[] = [];
  
  const haiti = getHaitiTime();
  const haitiDayNorm = haiti.day.toLowerCase().slice(0, 3);
  const isTargetDayHaitiToday = haitiDayNorm === normDay;
  const currentTotalMinutes = haiti.hours * 60 + haiti.minutes;

  programs.forEach(program => {
    program.schedules?.forEach(sch => {
      const schDays = sch.days.map(d => d.toLowerCase().slice(0, 3));
      if (!schDays.includes(normDay)) return;

      const [startH, startM = '0'] = sch.startTime.split(':');
      const [endH, endM = '0'] = sch.endTime.split(':');
      const start = parseInt(startH, 10) * 60 + parseInt(startM, 10);
      const end = parseInt(endH, 10) * 60 + parseInt(endM, 10);

      if (end > start) {
        blocks.push({
          program,
          startMinute: start,
          endMinute: end,
          duration: end - start,
          isCurrent: isTargetDayHaitiToday && currentTotalMinutes >= start && currentTotalMinutes < end
        });
      } else if (end < start) {
        blocks.push({
          program,
          startMinute: start,
          endMinute: 1440,
          duration: 1440 - start,
          isCurrent: isTargetDayHaitiToday && currentTotalMinutes >= start
        });
      }
    });
  });
  return blocks;
}

const GENRES = ['All', 'News', 'Music', 'Gospel', 'Sports', 'Talk', 'Culture'];

export default function ProgramGuideScreen() {
  return <ProgramGuideContent />;
}

function ProgramGuideContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { playStation, playerState, pause } = usePlayer();
  const { openDrawer } = useDrawer();
  const { stations, programs, loading: dataLoading } = useData();
  
  const [selectedDay, setSelectedDay] = useState<number>(getHaitiTime().day ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(getHaitiTime().day) : new Date().getDay());
  const [haitiNow, setHaitiNow] = useState(getHaitiTime());
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  const { width } = useWindowDimensions();

  const leftRef = useAnimatedRef<FlatList>();
  const rightRef = useAnimatedRef<FlatList>();
  const horizontalScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  const isScrollingLeft = useSharedValue(false);
  const isScrollingRight = useSharedValue(false);

  useEffect(() => {
    const interval = setInterval(() => {
        setHaitiNow(getHaitiTime());
    }, 30000); 
    return () => clearInterval(interval);
  }, []);

  const scrollToNow = () => {
    // 1. Set to today
    const todayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(getHaitiTime().day);
    if (todayIndex !== -1) {
      setSelectedDay(todayIndex);
      // Scroll day strip to today (tab width approx 60-80 + gap 15)
      dayScrollRef.current?.scrollTo({ x: todayIndex * 70, animated: true });
    }

    // 2. Scroll horizontal guide to current time
    const haiti = getHaitiTime();
    const currentMinutes = haiti.hours * 60 + haiti.minutes;
    const scrollX = (currentMinutes / 60) * CELL_WIDTH - (width - LEFT_COLUMN_WIDTH) / 2;
    horizontalScrollRef.current?.scrollTo({ 
      x: Math.max(0, scrollX), 
      animated: true 
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!dataLoading) {
        // Small delay to ensure refs are attached and layout is calculated
        const timer = setTimeout(scrollToNow, 300);
        return () => clearTimeout(timer);
      }
    }, [dataLoading])
  );



  const filteredStations = useMemo(() => {
    const active = stations.filter(s => s.name && s.streamUrl);
    if (selectedGenre === 'All') return active;
    return active.filter(s => 
      s.tag?.includes(selectedGenre) || 
      s.name.toLowerCase().includes(selectedGenre.toLowerCase())
    );
  }, [stations, selectedGenre]);

  const programsByStation = useMemo(() => {
    const grouped: Record<string, Program[]> = {};
    programs.forEach(p => {
      if (!grouped[p.stationId]) grouped[p.stationId] = [];
      grouped[p.stationId].push(p);
    });
    return grouped;
  }, [programs]);

  const guideData = useMemo(() => {
    const result: any[] = [];
    filteredStations.forEach((station, index) => {
      // Reduced ad density from index % 8 to index % 12 to improve performance
      if (index > 0 && index % 12 === 0) {
        result.push({ id: `ad-${index}`, isAd: true });
      }
      result.push(station);
    });
    return result;
  }, [filteredStations]);

  const onLeftScroll = useAnimatedScrollHandler({
    onBeginDrag: () => { isScrollingLeft.value = true; isScrollingRight.value = false; },
    onEndDrag: () => { isScrollingLeft.value = false; },
    onMomentumBegin: () => { isScrollingLeft.value = true; isScrollingRight.value = false; },
    onMomentumEnd: () => { isScrollingLeft.value = false; },
    onScroll: (event) => {
      if (isScrollingLeft.value) {
        scrollTo(rightRef, 0, event.contentOffset.y, false);
      }
    },
  });

  const onRightScroll = useAnimatedScrollHandler({
    onBeginDrag: () => { isScrollingRight.value = true; isScrollingLeft.value = false; },
    onEndDrag: () => { isScrollingRight.value = false; },
    onMomentumBegin: () => { isScrollingRight.value = true; isScrollingLeft.value = false; },
    onMomentumEnd: () => { isScrollingRight.value = false; },
    onScroll: (event) => {
      if (isScrollingRight.value) {
        scrollTo(leftRef, 0, event.contentOffset.y, false);
      }
    },
  });

  const LogoColumnItem = React.memo(({ item }: { item: Station }) => (
    <View style={styles.logoCell}>
      <Pressable 
        onPress={() => router.push({ pathname: '/station-details', params: { id: item.id } })}
        style={({pressed}) => [styles.logoContainer, pressed && { opacity: 0.7 }]}
      >
        <Image 
          source={item.logo ? { uri: item.logo.startsWith('http') ? item.logo : `https:${item.logo}` } : require('../../assets/images/favicon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.stationNameMini} numberOfLines={1}>{item.name}</Text>
      </Pressable>
    </View>
  ));

  const ProgramRow = React.memo(({ station }: { station: Station }) => {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDay];
    const stationPrograms = programsByStation[station.id] || [];
    const blocks = getBlocksForDay(stationPrograms, dayName);

    const isPlayingCurrentStation = playerState.isPlaying && playerState.currentStation?.id === station.id;

    return (
      <View style={styles.programRow}>
        {blocks.map((block, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.programBlock,
              {
                left: (block.startMinute / 60) * CELL_WIDTH,
                width: (block.duration / 60) * CELL_WIDTH,
                backgroundColor: block.isCurrent ? '#4c1d95' : '#1c1c1e'
              },
              block.isCurrent && styles.currentProgramBlock
            ]}
            onPress={() => router.push({ pathname: '/program-details', params: { id: block.program.id } })}
          >
            <Text style={styles.programName} numberOfLines={1}>{block.program.name}</Text>
            <Text style={styles.programTime} numberOfLines={1}>
                {Math.floor(block.startMinute/60)}:{(block.startMinute%60).toString().padStart(2,'0')} 
                - {Math.floor(block.endMinute/60)}:{(block.endMinute%60).toString().padStart(2,'0')}
            </Text>
            {block.isCurrent && (
              <TouchableOpacity 
                style={styles.livePlayButton}
                onPress={() => {
                  if (isPlayingCurrentStation) {
                    pause();
                  } else {
                    playStation(station);
                  }
                }}
              >
                <Ionicons 
                  name={isPlayingCurrentStation ? "pause" : "play"} 
                  size={16} 
                  color="#fff" 
                  style={{ marginLeft: isPlayingCurrentStation ? 0 : 2 }} 
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  });

  if (dataLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#a78bfa" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.profileButton} onPress={openDrawer}>
          <Text style={styles.profileButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guide</Text>
        <TouchableOpacity style={styles.liveNowButton} onPress={scrollToNow}>
            <Text style={styles.liveNowText}>LIVE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.genreStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreStrip}>
          {GENRES.map(genre => (
            <TouchableOpacity 
              key={genre} 
              onPress={() => setSelectedGenre(genre)}
              style={[styles.genreTab, selectedGenre === genre && styles.activeGenreTab]}
            >
              <Text style={[styles.genreText, selectedGenre === genre && styles.activeGenreText]}>{genre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.dayStripContainer}>
        <ScrollView ref={dayScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
            <TouchableOpacity 
              key={day} 
              onPress={() => setSelectedDay(i)}
              style={[styles.dayTab, selectedDay === i && styles.activeDayTab]}
            >
              <Text style={[styles.dayText, selectedDay === i && styles.activeDayText]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: LEFT_COLUMN_WIDTH }}>
          <View style={[styles.timeHeader, { height: TIME_ROW_HEIGHT }]} />
          <ReanimatedFlatList
            ref={leftRef}
            data={guideData}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: any) => item.isAd ? (
              <View style={{ height: STATION_ROW_HEIGHT, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#555', fontSize: 8, fontWeight: '900' }}>SPONSORED</Text>
              </View>
            ) : <LogoColumnItem item={item} />}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onLeftScroll}
            getItemLayout={(data, index) => ({ length: STATION_ROW_HEIGHT, offset: STATION_ROW_HEIGHT * index, index })}
            initialNumToRender={8}
            windowSize={5}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
          />
        </View>

        <ScrollView 
          ref={horizontalScrollRef} 
          horizontal 
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <View>
            <View style={[styles.timeRow, { height: TIME_ROW_HEIGHT }]}>
              {HOURS.map(hour => (
                <View key={hour} style={[styles.timeCell, { width: CELL_WIDTH }]}>
                  <Text style={styles.timeText}>{hour}:00</Text>
                </View>
              ))}
              <View style={[styles.currentTimeIndicator, { left: (haitiNow.hours * 60 + haitiNow.minutes) * (CELL_WIDTH / 60) }]} />
            </View>

            <ReanimatedFlatList
              ref={rightRef}
              data={guideData}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }: any) => item.isAd ? (
                <View style={{ width: 24 * CELL_WIDTH, height: STATION_ROW_HEIGHT, backgroundColor: '#000', flexDirection: 'row', alignItems: 'center' }}>
                   {[0, 6, 12, 18].map((h) => (
                     <View key={h} style={{ width: 6 * CELL_WIDTH, height: STATION_ROW_HEIGHT, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 }}>
                        <AdBanner height={STATION_ROW_HEIGHT - 20} type="banner" />
                     </View>
                   ))}
                </View>
              ) : <ProgramRow station={item} />}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onRightScroll}
              getItemLayout={(data, index) => ({ length: STATION_ROW_HEIGHT, offset: STATION_ROW_HEIGHT * index, index })}
              initialNumToRender={8}
              windowSize={5}
              maxToRenderPerBatch={5}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={true}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  headerRow: {
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
    backgroundColor: 'black',
    marginBottom: 5,
  },
  headerTitle: { color: '#a78bfa', fontSize: 22, fontWeight: '900' },
  profileButton: { padding: 4 },
  profileButtonText: { color: '#a78bfa', fontSize: 28, fontWeight: '700' },
  liveNowButton: { backgroundColor: '#a78bfa', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  liveNowText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  genreStripContainer: { backgroundColor: 'black', paddingBottom: 5 },
  genreStrip: { paddingHorizontal: 15, gap: 10 },
  genreTab: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1c1c1e' },
  activeGenreTab: { backgroundColor: '#a78bfa' },
  genreText: { color: '#a1a1aa', fontWeight: '600' },
  activeGenreText: { color: '#fff' },
  dayStripContainer: { borderBottomWidth: 1, borderBottomColor: '#27272a', backgroundColor: 'black' },
  dayStrip: { paddingHorizontal: 15, paddingVertical: 10, gap: 15 },
  dayTab: { paddingBottom: 5 },
  activeDayTab: { borderBottomWidth: 2, borderBottomColor: '#a78bfa' },
  dayText: { color: '#a1a1aa', fontWeight: 'bold' },
  activeDayText: { color: '#fff' },
  timeHeader: { backgroundColor: 'black', borderRightWidth: 1, borderRightColor: '#27272a' },
  logoCell: { height: STATION_ROW_HEIGHT, width: LEFT_COLUMN_WIDTH, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#27272a', backgroundColor: 'black' },
  logoContainer: { alignItems: 'center', gap: 4 },
  logo: { width: 50, height: 50, borderRadius: 25 },
  stationNameMini: { color: '#a1a1aa', fontSize: 10, fontWeight: '600' },
  timeRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#27272a', backgroundColor: 'black' },
  timeCell: { justifyContent: 'center', paddingLeft: 5 },
  timeText: { color: '#a1a1aa', fontSize: 12, fontWeight: '600' },
  programRow: { height: STATION_ROW_HEIGHT, width: 24 * CELL_WIDTH, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  programBlock: { position: 'absolute', top: 5, bottom: 5, borderRadius: 8, padding: 8, justifyContent: 'center' },
  currentProgramBlock: { borderColor: '#a78bfa', borderWidth: 1 },
  programName: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  programTime: { color: '#a1a1aa', fontSize: 10, marginTop: 2 },
  livePlayButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#a78bfa',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentTimeIndicator: { position: 'absolute', top: 0, bottom: -10000, width: 2, backgroundColor: '#ef4444', zIndex: 100 },
});