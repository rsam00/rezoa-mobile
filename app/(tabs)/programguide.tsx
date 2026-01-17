import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue
} from 'react-native-reanimated';
import { usePlayer } from '../../contexts/PlayerContext';
import { programs as allPrograms } from '../../data/programs_updated';
import { stations as allStations } from '../../data/working_stations_2';
import { getHaitiTime } from '../../utils/timeUtils';

const ReanimatedFlatList = Animated.createAnimatedComponent(FlatList);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CELL_WIDTH = 120;
const STATION_ROW_HEIGHT = 90;
const TIME_ROW_HEIGHT = 45;
const LEFT_COLUMN_WIDTH = 100;

// Types
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

// Helper for overnight split
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
        // Spill over to next day - handle part on this day
        blocks.push({
          program,
          startMinute: start,
          endMinute: 1440,
          duration: 1440 - start,
          isCurrent: isTargetDayHaitiToday && currentTotalMinutes >= start
        });
      }
    });

    // Handle spillover from PREVIOUS day
    program.schedules?.forEach(sch => {
      const schDays = sch.days.map(d => d.toLowerCase().slice(0, 3));
      const daysArr = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const currentDayIdx = daysArr.indexOf(normDay);
      if (currentDayIdx === -1) return;
      const prevDayIdx = (currentDayIdx + 6) % 7;
      const prevDayName = daysArr[prevDayIdx];

      if (!schDays.includes(prevDayName)) return;

      const [startH, startM = '0'] = sch.startTime.split(':');
      const [endH, endM = '0'] = sch.endTime.split(':');
      const start = parseInt(startH, 10) * 60 + parseInt(startM, 10);
      const end = parseInt(endH, 10) * 60 + parseInt(endM, 10);

      if (end < start) {
        blocks.push({
          program,
          startMinute: 0,
          endMinute: end,
          duration: end,
          isCurrent: isTargetDayHaitiToday && currentTotalMinutes < end
        });
      }
    });
  });

  return blocks.sort((a, b) => a.startMinute - b.startMinute);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Pre-setup notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const SkeletonRow = () => (
  <View style={styles.skeletonRow}>
    <View style={styles.skeletonLogo} />
    <View style={[styles.skeletonCard, { width: CELL_WIDTH * 2 }]} />
    <View style={[styles.skeletonCard, { width: CELL_WIDTH * 3 }]} />
    <View style={[styles.skeletonCard, { width: CELL_WIDTH * 1.5 }]} />
  </View>
);

const GENRES = ['All', 'News', 'Music', 'Gospel', 'Sports', 'Talk', 'Culture'];

export default function ProgramGuide() {
  const router = useRouter();
  const { playStation } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [programsByStation, setProgramsByStation] = useState<Record<string, Program[]>>({});
  const [selectedDay, setSelectedDay] = useState<number>(getHaitiTime().day ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(getHaitiTime().day) : new Date().getDay());
  const [haitiNow, setHaitiNow] = useState(getHaitiTime());

  // Keep Haiti time in sync - Reduced frequency to 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setHaitiNow(getHaitiTime());
    }, 30000); 
    return () => clearInterval(interval);
  }, []);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const scrollY = useSharedValue(0);
  const isScrollingLeft = useSharedValue(false);
  const isScrollingRight = useSharedValue(false);
  const leftRef = useAnimatedRef<FlatList>();
  const rightRef = useAnimatedRef<FlatList>();
  const horizontalScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);

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

  // No animated reaction needed if we sync in handlers

  useEffect(() => {
    // Simulate data loading for skeleton demo
    setTimeout(() => {
      const grouped: Record<string, Program[]> = {};
      allPrograms.forEach(p => {
        if (!grouped[p.stationId]) grouped[p.stationId] = [];
        grouped[p.stationId].push(p);
      });
      setProgramsByStation(grouped);
      const activeStations = allStations.filter(s => s.name && s.streamUrl);
      setStations(activeStations);
      setFilteredStations(activeStations);
      setLoading(false);
    }, 1500);

    Notifications.requestPermissionsAsync();
  }, []);

  // Update filtered list when genre changes
  useEffect(() => {
    if (selectedGenre === 'All') {
      setFilteredStations(stations);
    } else {
      setFilteredStations(stations.filter(s => 
        s.tag?.includes(selectedGenre) || 
        s.name.toLowerCase().includes(selectedGenre.toLowerCase())
      ));
    }
  }, [selectedGenre, stations]);

  const handleReminder = async (program: Program, startHour: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const trigger = new Date();
    trigger.setHours(startHour, 0, 0, 0);
    if (trigger < new Date()) trigger.setDate(trigger.getDate() + 7);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${program.name}`,
        body: `Starting now on ${program.stationId}.`,
        data: { stationId: program.stationId },
      },
      trigger: {
        hour: startHour,
        minute: 0,
        repeats: false,
      } as any, // Use any if type is being stubborn or I'll try to find the exact type
    });
    alert(`Reminder set for ${program.name}!`);
  };

  const jumpToLive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // 1. Automatically select current day if not already selected
    const haiti = getHaitiTime();
    const dayIdx = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(haiti.day);
    if (dayIdx !== -1) {
      setSelectedDay(dayIdx);
      // Ensure day strip scrolls even if day was already selected but off-screen
      // Approx 75px per day tab (padding + margins)
      dayScrollRef.current?.scrollTo({ x: dayIdx * 75, animated: true });
    }

    // 2. Scroll to current time
    const pixPerMin = CELL_WIDTH / 60;
    const timelinePos = (haiti.totalSeconds / 60) * pixPerMin;
    const viewportWidth = width - LEFT_COLUMN_WIDTH;
    const scrollPos = Math.max(0, timelinePos - viewportWidth / 2);
    
    horizontalScrollRef.current?.scrollTo({ x: scrollPos, animated: true });
  };

  const LogoColumnItem = React.memo(({ item, onPress }: { item: Station, onPress: (id: string) => void }) => (
    <View style={styles.logoCell}>
      <Pressable 
        onPress={() => onPress(item.id)}
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

  const ProgramRowItem = React.memo(({ 
    station, 
    programs, 
    selectedDay, 
    haitiNow,
    onPressProgram,
    onPlayStation 
  }: { 
    station: Station, 
    programs: Program[], 
    selectedDay: number,
    haitiNow: any,
    onPressProgram: (id: string) => void,
    onPlayStation: (s: any) => void
  }) => {
    const blocks = getBlocksForDay(programs || [], DAYS[selectedDay]);
    const pixPerMin = CELL_WIDTH / 60;
    let currentPos = 0;
    const rowCells: React.ReactNode[] = [];

    const formatMins = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}:${m.toString().padStart(2, '0')}`;
    };

    blocks.forEach((block, bIdx) => {
      const gap = block.startMinute - currentPos;
      if (gap > 0) {
        rowCells.push(<View key={`gap-${bIdx}`} style={{ width: gap * pixPerMin }} />);
      }
      
      const cardWidth = Math.max(0, block.duration * pixPerMin);
      
      rowCells.push(
        <TouchableOpacity 
          key={block.program.id + bIdx}
          onPress={() => onPressProgram(block.program.id)}
          onLongPress={() => onPlayStation({ id: station.id, name: station.name, streamUrl: station.streamUrl })}
          style={[
            styles.programCard, 
            { width: cardWidth - 2 },
            block.isCurrent && styles.currentProgramCard
          ]}
        >
          <BlurView intensity={block.isCurrent ? 40 : 10} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, block.isCurrent && styles.currentText]} numberOfLines={1}>{block.program.name}</Text>
            {block.program.host && <Text style={[styles.cardHost, block.isCurrent && styles.currentTextSecondary]} numberOfLines={1}>{block.program.host}</Text>}
            <Text style={[styles.cardTime, block.isCurrent && styles.currentTextSecondary]}>{formatMins(block.startMinute)} - {formatMins(block.endMinute)}</Text>
          </View>
          {block.isCurrent && (
            <TouchableOpacity 
              style={styles.cardPlayBtn}
              onPress={(e) => {
                e.stopPropagation();
                onPlayStation({ id: station.id, name: station.name, streamUrl: station.streamUrl });
              }}
            >
              <Text style={styles.cardPlayIcon}>▶</Text>
            </TouchableOpacity>
          )}
          {block.isCurrent && <View style={styles.liveIndicator} />}
        </TouchableOpacity>
      );
      currentPos = Math.max(currentPos, block.endMinute);
    });

    if (currentPos < 1440) {
      rowCells.push(<View key="end-gap" style={{ width: (1440 - currentPos) * pixPerMin }} />);
    }

    return <View style={styles.programRow}>{rowCells}</View>;
  });

  if (loading) return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.topHeader}>
        <View style={[styles.skeletonLogo, { width: 120, height: 40, marginBottom: 20 }]} />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </View>
    </SafeAreaView>
  );

  const now = new Date();
  const timelineLeft = (now.getHours() + now.getMinutes() / 60) * CELL_WIDTH;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={[styles.topHeader, isLandscape && { paddingBottom: 0 }]}>
        {!isLandscape && <Text style={styles.headerText}>Guide</Text>}
        
        {/* Genre Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={[styles.dayStrip, isLandscape && { paddingRight: 10 }]}
        >
          {GENRES.map(genre => (
            <TouchableOpacity 
              key={genre} 
              onPress={() => {
                setSelectedGenre(genre);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.genreTab, selectedGenre === genre && styles.dayTabActive, isLandscape && { paddingVertical: 4 }]}
            >
              <Text style={[styles.dayTabText, selectedGenre === genre && styles.dayTabTextActive, isLandscape && { fontSize: 12 }]}>
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Day Strip */}
        <ScrollView 
          ref={dayScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={[styles.dayStrip, { marginTop: 8 }, isLandscape && { marginTop: 4 }]}
        >
          {DAYS.map((day, idx) => (
            <TouchableOpacity 
              key={day} 
              onPress={() => {
                setSelectedDay(idx);
                Haptics.selectionAsync();
              }}
              style={[styles.dayTab, selectedDay === idx && styles.dayTabActive, isLandscape && { paddingVertical: 4 }]}
            >
              <Text style={[styles.dayTabText, selectedDay === idx && styles.dayTabTextActive, isLandscape && { fontSize: 12 }]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mainGrid}>
        <View style={styles.leftColumn}>
          <View style={styles.cornerCell}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </View>
          <ReanimatedFlatList
            ref={leftRef}
            data={filteredStations}
            renderItem={({ item }: { item: Station }) => (
              <LogoColumnItem 
                item={item} 
                onPress={(id) => router.push({ pathname: '/station-details', params: { id } })} 
              />
            )}
            keyExtractor={(s: any) => s.id}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onLeftScroll}
            getItemLayout={(_: any, i: number) => ({ length: STATION_ROW_HEIGHT, offset: STATION_ROW_HEIGHT * i, index: i })}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
          />
        </View>

        <ScrollView ref={horizontalScrollRef} horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.timeHeader}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              {HOURS.map(h => {
                let color = '#1c1c1e';
                if (h >= 6 && h < 12) color = '#2c2c2e';
                if (h >= 12 && h < 18) color = '#3a3a3c';
                return (
                  <View key={h} style={[styles.timeCell, { backgroundColor: color }]}>
                    <Text style={styles.timeLabel}>{h}:00</Text>
                  </View>
                );
              })}
            </View>

            <ReanimatedFlatList
              ref={rightRef}
              data={filteredStations}
              renderItem={({ item: station }: { item: Station }) => (
                <ProgramRowItem 
                  station={station}
                  programs={programsByStation[station.id]}
                  selectedDay={selectedDay}
                  haitiNow={haitiNow}
                  onPressProgram={(id) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/program-details', params: { id } });
                  }}
                  onPlayStation={(s) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    playStation(s);
                  }}
                />
              )}
              keyExtractor={(s: any) => s.id}
              showsVerticalScrollIndicator={true}
              scrollEventThrottle={16}
              onScroll={onRightScroll}
              contentContainerStyle={{ paddingBottom: 160 }} // Safe padding for player
              getItemLayout={(_: any, i: number) => ({ length: STATION_ROW_HEIGHT, offset: STATION_ROW_HEIGHT * i, index: i })}
              windowSize={5}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={Platform.OS === 'android'}
            />

            {selectedDay === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(haitiNow.day) && (
              <View style={[styles.timeline, { left: (haitiNow.totalSeconds / 60) * (CELL_WIDTH / 60) }]} pointerEvents="none" />
            )}
          </View>
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.jumpBtn} onPress={jumpToLive}>
        <Text style={styles.jumpBtnText}>JUMP TO LIVE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginBottom: 12,
  },
  dayStrip: {
    paddingRight: 20,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    marginRight: 8,
  },
  dayTabActive: {
    backgroundColor: '#a78bfa',
  },
  genreTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    marginRight: 8,
  },
  dayTabText: {
    color: '#8e8e93',
    fontWeight: '600',
  },
  dayTabTextActive: {
    color: '#fff',
  },
  mainGrid: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    width: LEFT_COLUMN_WIDTH,
    zIndex: 10,
    backgroundColor: '#000',
    borderRightWidth: 1,
    borderRightColor: '#1c1c1e',
  },
  cornerCell: {
    height: TIME_ROW_HEIGHT,
  },
  logoCell: {
    height: STATION_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  logoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  logo: {
    width: '80%',
    height: '60%',
  },
  stationNameMini: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 2,
    fontWeight: '500',
  },
  timeHeader: {
    flexDirection: 'row',
    height: TIME_ROW_HEIGHT,
    backgroundColor: '#000',
  },
  timeCell: {
    width: CELL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#1c1c1e',
  },
  timeLabel: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '700',
  },
  programRow: {
    flexDirection: 'row',
    height: STATION_ROW_HEIGHT,
  },
  programCard: {
    height: STATION_ROW_HEIGHT - 10,
    marginTop: 5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    marginHorizontal: 1,
  },
  currentProgramCard: {
    borderColor: '#a78bfa',
    borderWidth: 2,
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardHost: {
    color: '#8e8e93',
    fontSize: 11,
    marginTop: 2,
  },
  cardTime: {
    color: '#636366',
    fontSize: 10,
    marginTop: 2,
  },
  currentText: {
    color: '#fff',
  },
  currentTextSecondary: {
    color: '#e5e5ea',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff3b30',
  },
  cardPlayBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardPlayIcon: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 2,
  },
  timeline: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#ff3b30',
    zIndex: 100,
  },
  jumpBtn: {
    position: 'absolute',
    bottom: 180, // Moved up to clear Docked Player (90) + Player Height (64)
    right: 20,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  jumpBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STATION_ROW_HEIGHT,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  skeletonLogo: {
    width: 80,
    height: 60,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginRight: 10,
  },
  skeletonCard: {
    height: STATION_ROW_HEIGHT - 20,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginRight: 5,
  },
});
 