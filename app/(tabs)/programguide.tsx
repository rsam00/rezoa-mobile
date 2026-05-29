import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
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
  Platform,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay
} from 'react-native-reanimated';
import AdBanner from '../../components/AdBanner';
import { useData } from '../../contexts/DataContext';
import { useDrawer } from '../../contexts/DrawerContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { getHaitiTime } from '../../utils/timeUtils';
import TopNavigation from '../../components/TopNavigation';

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

const GENRE_MAPPING: Record<string, string[]> = {
  'Pop': ['pop', 'pop music', 'top 40', 'contemporary hits'],
  'Rock': ['rock', 'hard rock', 'indie rock'],
  'Classic Rock': ['classic rock', 'classic hits'],
  'Alternative / Indie': ['alternative', 'alternative rock', 'indie', 'adult album alternative'],
  'Country': ['country', 'classic country', 'americana'],
  'Classical': ['classical', 'classical music'],
  'Jazz & Blues': ['jazz', 'smooth jazz', 'blues'],
  'Hip Hop & R&B': ['hip hop', 'hip-hop', 'hiphop', 'rap', 'rnb', 'r&b', 'soul', 'funk'],
  'Electronic & Dance': ['electronic', 'electronica', 'dance', 'house', 'disco'],
  'Chill & Ambient': ['chillout', 'ambient', 'downtempo', 'lounge'],
  'Latin & Caribbean': ['regional mexican', 'banda', 'reggae'],
  'Folk & Acoustic': ['folk', 'bluegrass'],
  'World Music': ['world music'],
  'News': ['news', 'local news', 'information'],
  'Talk Radio': ['talk', 'talk radio', 'conservative talk', 'news talk'],
  'Sports': ['sports', 'sport'],
  'Public Radio': ['public radio', 'npr', 'pri', 'bbc', 'apm'],
  'College & Community': ['community radio', 'college radio', 'university radio', 'freeform'],
  'Christian & Gospel': ['christian', 'christian contemporary', 'gospel', 'religious'],
  'Oldies': ['oldies'],
  '60s': ['60s'],
  '70s': ['70s'],
  '80s': ['80s', "80's"],
  '90s': ['90s'],
  'Holiday': ['christmas music', 'christmas']
};

const GENRES = ['All', ...Object.keys(GENRE_MAPPING)];
type FilterType = 'Country' | 'Department' | 'City' | 'Genre' | null;

function AnimatedEqualizer() {
  const bar1 = useSharedValue(4);
  const bar2 = useSharedValue(4);
  const bar3 = useSharedValue(4);

  useEffect(() => {
    bar1.value = withRepeat(withSequence(withTiming(12, { duration: 400 }), withTiming(4, { duration: 400 })), -1, true);
    bar2.value = withDelay(200, withRepeat(withSequence(withTiming(14, { duration: 350 }), withTiming(4, { duration: 350 })), -1, true));
    bar3.value = withDelay(400, withRepeat(withSequence(withTiming(10, { duration: 300 }), withTiming(4, { duration: 300 })), -1, true));
  }, []);

  const style1 = useAnimatedStyle(() => ({ height: bar1.value }));
  const style2 = useAnimatedStyle(() => ({ height: bar2.value }));
  const style3 = useAnimatedStyle(() => ({ height: bar3.value }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14, marginTop: 4 }}>
      <Animated.View style={[{ width: 3, backgroundColor: '#a78bfa', borderRadius: 2 }, style1]} />
      <Animated.View style={[{ width: 3, backgroundColor: '#a78bfa', borderRadius: 2 }, style2]} />
      <Animated.View style={[{ width: 3, backgroundColor: '#a78bfa', borderRadius: 2 }, style3]} />
    </View>
  );
}

export default function ProgramGuideScreen() {
  return <ProgramGuideContent />;
}

function ProgramGuideContent() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const router = useRouter();
  const { playStation, playerState, pause } = usePlayer();
  const { stations, programs, loading: dataLoading } = useData();
  
  const [selectedDay, setSelectedDay] = useState<number>(getHaitiTime().day ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(getHaitiTime().day) : new Date().getDay());
  const [haitiNow, setHaitiNow] = useState(getHaitiTime());
  
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => s.country && set.add(s.country));
    return ['All', ...Array.from(set).sort()];
  }, [stations]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => {
      if ((selectedCountry === 'All' || s.country === selectedCountry) && s.department) {
        set.add(s.department);
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [stations, selectedCountry]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => {
      if (
        (selectedCountry === 'All' || s.country === selectedCountry) &&
        (selectedDepartment === 'All' || s.department === selectedDepartment) &&
        s.city
      ) {
        set.add(s.city);
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [stations, selectedCountry, selectedDepartment]);

  useEffect(() => {
    if (dataLoading || stations.length === 0 || locationDetected) return;

    const detectLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const geocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          
          if (geocode && geocode.length > 0) {
            const place = geocode[0];
            const userCountry = place.country;
            const userRegion = place.region;
            const userCity = place.city;
            
            if (userCountry && availableCountries.includes(userCountry)) {
              setSelectedCountry(userCountry);
              
              const validDepartments = new Set<string>();
              const validCities = new Set<string>();
              
              stations.forEach(s => {
                if (s.country === userCountry && s.department) validDepartments.add(s.department);
                if (s.country === userCountry && s.department === userRegion && s.city) validCities.add(s.city);
              });
              
              if (userRegion && validDepartments.has(userRegion)) {
                setSelectedDepartment(userRegion);
              }
              if (userCity && validCities.has(userCity)) {
                setSelectedCity(userCity);
              }
            }
            setLocationDetected(true);
            return; // Exit early if GPS succeeded
          }
        }
      } catch (err) {
        console.log('GPS Location failed', err);
      }
      
      // Fallback to IP Location
      try {
        const response = await fetch('http://ip-api.com/json/');
        const data = await response.json();
        
        if (data.status === 'success') {
          const userCountry = data.country;
          const userRegion = data.regionName;
          const userCity = data.city;
          
          if (availableCountries.includes(userCountry)) {
            setSelectedCountry(userCountry);
            
            const validDepartments = new Set<string>();
            const validCities = new Set<string>();
            
            stations.forEach(s => {
              if (s.country === userCountry && s.department) validDepartments.add(s.department);
              if (s.country === userCountry && s.department === userRegion && s.city) validCities.add(s.city);
            });
            
            if (userRegion && validDepartments.has(userRegion)) {
              setSelectedDepartment(userRegion);
            }
            if (userCity && validCities.has(userCity)) {
              setSelectedCity(userCity);
            }
          }
        }
      } catch (e) {
        console.log('IP Location failed', e);
      } finally {
        setLocationDetected(true);
      }
    };
    
    detectLocation();
  }, [dataLoading, stations, availableCountries, locationDetected]);

  const handleSelectCountry = (val: string) => {
    setSelectedCountry(val);
    setSelectedDepartment('All');
    setSelectedCity('All');
    setActiveFilter(null);
  };
  const handleSelectDepartment = (val: string) => {
    setSelectedDepartment(val);
    setSelectedCity('All');
    setActiveFilter(null);
  };
  const handleSelectCity = (val: string) => {
    setSelectedCity(val);
    setActiveFilter(null);
  };
  const handleSelectGenre = (val: string) => {
    setSelectedGenre(val);
    setActiveFilter(null);
  };

  const leftRef = useAnimatedRef<FlatList>();
  const rightRef = useAnimatedRef<FlatList>();
  const horizontalScrollRef = useAnimatedRef<Animated.ScrollView>();
  const dayScrollRef = useRef<ScrollView>(null);

  const isScrollingLeft = useSharedValue(false);
  const isScrollingRight = useSharedValue(false);
  
  const scrollX = useSharedValue(0);
  const currentLineX = useSharedValue(0);

  useEffect(() => {
    currentLineX.value = (haitiNow.hours * 60 + haitiNow.minutes) * (CELL_WIDTH / 60);
  }, [haitiNow]);

  const horizontalScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const liveDotStyle = useAnimatedStyle(() => {
    const visibleWidth = width - LEFT_COLUMN_WIDTH;
    const isVisible = currentLineX.value >= scrollX.value && currentLineX.value <= scrollX.value + visibleWidth;
    return {
      opacity: withTiming(isVisible ? 1 : 0.3, { duration: 300 })
    };
  });

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
    let active = stations.filter(s => s.name && s.streamUrl);
    if (selectedCountry !== 'All') {
      active = active.filter(s => s.country === selectedCountry);
    }
    if (selectedDepartment !== 'All') {
      active = active.filter(s => s.department === selectedDepartment);
    }
    if (selectedCity !== 'All') {
      active = active.filter(s => s.city === selectedCity);
    }
    if (selectedGenre !== 'All') {
      const mappedTags = GENRE_MAPPING[selectedGenre] || [selectedGenre.toLowerCase()];
      active = active.filter(s => {
        if (s.name.toLowerCase().includes(selectedGenre.toLowerCase())) return true;
        
        if (s.tag && s.tag.length > 0) {
          const stationTags = s.tag.map(t => t.toLowerCase());
          return mappedTags.some(mapped => stationTags.includes(mapped) || stationTags.some(t => t.includes(mapped)));
        }
        return false;
      });
    }
    return active;
  }, [stations, selectedCountry, selectedDepartment, selectedCity, selectedGenre]);

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

  const renderLogoColumnItem = React.useCallback(({ item }: any) => {
    if (item.isAd) {
      return (
        <View style={{ height: STATION_ROW_HEIGHT, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#555', fontSize: 8, fontWeight: '900' }}>SPONSORED</Text>
        </View>
      );
    }
    const isPlaying = playerState.isPlaying && playerState.currentStation?.id === item.id;
    return (
      <View style={[styles.logoCell, isPlaying && { backgroundColor: 'rgba(167, 139, 250, 0.05)' }]}>
        <Pressable 
          onPress={() => router.push({ pathname: '/station-details', params: { id: item.id } })}
          style={({pressed}) => [styles.logoContainer, pressed && { opacity: 0.7 }]}
        >
          <Image 
            source={item.logo ? { uri: item.logo.startsWith('http') ? item.logo : `https:${item.logo}` } : require('../../assets/images/app-icon-primary.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          {isPlaying ? (
            <AnimatedEqualizer />
          ) : (
            <Text style={styles.stationNameMini} numberOfLines={1}>{item.name}</Text>
          )}
        </Pressable>
      </View>
    );
  }, [playerState.isPlaying, playerState.currentStation?.id, router]);

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
            activeOpacity={0.8}
            style={[
              styles.programBlock,
              {
                left: (block.startMinute / 60) * CELL_WIDTH,
                width: (block.duration / 60) * CELL_WIDTH,
                backgroundColor: block.isCurrent ? 'rgba(76, 29, 149, 0.15)' : '#1c1c1e'
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
    <View style={styles.container}>
      <TopNavigation />
      
      <View style={[{ flex: 1 }, isLandscape ? { marginLeft: 160 } : {}]}>
        <View style={[styles.dayStripContainer, { flexDirection: 'row', alignItems: 'center', paddingRight: 15, paddingTop: isLandscape ? insets.top + 10 : insets.top + 70 }]}>
        <TouchableOpacity style={styles.filtersButton} onPress={() => setShowFiltersMenu(true)}>
           <Ionicons name="filter" size={16} color="#d4d4d8" />
           <Text style={styles.filtersButtonText}>Filters</Text>
        </TouchableOpacity>
        
        <ScrollView ref={dayScrollRef} horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.dayStrip}>
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
        <TouchableOpacity style={styles.liveNowButton} onPress={scrollToNow}>
          <Animated.View style={[styles.liveDot, liveDotStyle]} />
          <Text style={styles.liveNowText}>LIVE</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: LEFT_COLUMN_WIDTH }}>
          <View style={[styles.timeHeader, { height: TIME_ROW_HEIGHT }]} />
          <ReanimatedFlatList
            ref={leftRef}
            data={guideData}
            keyExtractor={(item: any) => item.id}
            renderItem={renderLogoColumnItem}
            contentContainerStyle={{ paddingBottom: 100 }}
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

        <Animated.ScrollView 
          ref={horizontalScrollRef} 
          horizontal 
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={horizontalScrollHandler}
        >
          <View>
            <View style={[styles.timeRow, { height: TIME_ROW_HEIGHT }]}>
              {HOURS.map(hour => (
                <View key={hour} style={[styles.timeCell, { width: CELL_WIDTH }]}>
                  <Text style={styles.timeText}>{hour}:00</Text>
                </View>
              ))}
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
              contentContainerStyle={{ paddingBottom: 100 }}
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
          {/* Red "now" line rendered LAST so it always paints above program blocks */}
          <View
            pointerEvents="none"
            style={[
              styles.currentTimeIndicator,
              { left: (haitiNow.hours * 60 + haitiNow.minutes) * (CELL_WIDTH / 60) },
            ]}
          />
        </Animated.ScrollView>
      </View>
      </View>

      <Modal visible={showFiltersMenu} animationType="fade" transparent={true} onRequestClose={() => setShowFiltersMenu(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowFiltersMenu(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={[styles.modalContent, { maxHeight: 'auto' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFiltersMenu(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalOption} onPress={() => { setShowFiltersMenu(false); setActiveFilter('Country'); }}>
              <Text style={styles.modalOptionText}>Country: <Text style={{color:'#a78bfa'}}>{selectedCountry === 'United States' ? 'USA' : selectedCountry}</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => { setShowFiltersMenu(false); setActiveFilter('Department'); }}>
              <Text style={styles.modalOptionText}>{(selectedCountry === 'United States' || selectedCountry === 'USA') ? 'State' : 'Department'}: <Text style={{color:'#a78bfa'}}>{selectedDepartment}</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => { setShowFiltersMenu(false); setActiveFilter('City'); }}>
              <Text style={styles.modalOptionText}>City: <Text style={{color:'#a78bfa'}}>{selectedCity}</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => { setShowFiltersMenu(false); setActiveFilter('Genre'); }}>
              <Text style={styles.modalOptionText}>Genre: <Text style={{color:'#a78bfa'}}>{selectedGenre}</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!activeFilter} animationType="slide" transparent={true} onRequestClose={() => setActiveFilter(null)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setActiveFilter(null)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {activeFilter === 'Department' && (selectedCountry === 'USA' || selectedCountry === 'United States') ? 'State' : activeFilter}
              </Text>
              <TouchableOpacity onPress={() => setActiveFilter(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={
                activeFilter === 'Country' ? availableCountries :
                activeFilter === 'Department' ? availableDepartments :
                activeFilter === 'City' ? availableCities :
                activeFilter === 'Genre' ? GENRES : []
              }
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    if (activeFilter === 'Country') handleSelectCountry(item);
                    else if (activeFilter === 'Department') handleSelectDepartment(item);
                    else if (activeFilter === 'City') handleSelectCity(item);
                    else if (activeFilter === 'Genre') handleSelectGenre(item);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    (activeFilter === 'Country' && selectedCountry === item) ||
                    (activeFilter === 'Department' && selectedDepartment === item) ||
                    (activeFilter === 'City' && selectedCity === item) ||
                    (activeFilter === 'Genre' && selectedGenre === item) ? { color: '#a78bfa', fontWeight: 'bold' } : {}
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  liveNowButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveNowText: { color: '#fff', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5 },
  genreStripContainer: { backgroundColor: 'black', paddingBottom: 5 },
  genreStrip: { paddingHorizontal: 15, gap: 10 },
  genreTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center' },
  activeGenreTab: { backgroundColor: 'rgba(167, 139, 250, 0.15)', borderColor: '#a78bfa' },
  genreText: { color: '#d4d4d8', fontWeight: '600', fontSize: 13 },
  activeGenreText: { color: '#fff', fontWeight: 'bold' },
  filtersButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 10, borderRightWidth: 1, borderRightColor: '#27272a' },
  filtersButtonText: { color: '#d4d4d8', fontWeight: 'bold', fontSize: 13 },
  dayStripContainer: { borderBottomWidth: 1, borderBottomColor: '#27272a', backgroundColor: 'black' },
  dayStrip: { paddingHorizontal: 15, paddingVertical: 10, gap: 15 },
  dayTab: { paddingBottom: 5 },
  activeDayTab: { borderBottomWidth: 2, borderBottomColor: '#a78bfa' },
  dayText: { color: '#a1a1aa', fontWeight: 'bold' },
  activeDayText: { color: '#fff' },
  timeHeader: { backgroundColor: 'black', borderRightWidth: 1, borderRightColor: '#27272a' },
  logoCell: { height: STATION_ROW_HEIGHT, width: LEFT_COLUMN_WIDTH, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#27272a', backgroundColor: 'black' },
  logoContainer: { alignItems: 'center', gap: 4 },
  logo: { width: 80, height: 50 },
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
  currentTimeIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#ef4444',
    zIndex: 999,
    elevation: 999,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1c1c1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', padding: 20, paddingBottom: 40, width: '100%', maxWidth: 500, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  modalOptionText: { color: '#fff', fontSize: 16 },
});