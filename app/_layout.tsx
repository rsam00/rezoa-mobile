import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import mobileAds from 'react-native-google-mobile-ads';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../contexts/AuthContext';
import { ContributionsProvider } from '../contexts/ContributionsContext';
import { DataProvider } from '../contexts/DataContext';
import { DrawerProvider } from '../contexts/DrawerContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { HistoryProvider } from '../contexts/HistoryContext';
import { PlayerProvider } from '../contexts/PlayerContext';

import * as NavigationBar from 'expo-navigation-bar';
import Sidebar from '../components/Sidebar';
import MiniPlayer from './MiniPlayer';

import TrackPlayer from 'react-native-track-player';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Register the background playback service for Track Player
TrackPlayer.registerPlaybackService(() => require('../service'));

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // We will hide the splash screen in the Home Screen component once it mounts.
  useEffect(() => {
    // Delay Mobile Ads initialization by 3 seconds to prevent concurrent network spikes
    // that crash certain emulators during the initial Supabase data sync.
    setTimeout(() => {
      mobileAds()
        .initialize()
        .then(adapterStatuses => {
          console.log('Mobile Ads Initialized', adapterStatuses);
        });
    }, 3000);
      
  }, []);
  
  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: '#2e1065' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <DataProvider>
          <HistoryProvider>
            <PlayerProvider>
              <FavoritesProvider>
                <ContributionsProvider>
                  <DrawerProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                      <View style={{ flex: 1, backgroundColor: 'black' }}>
                        <StatusBar style="light" />
                        <Stack>
                          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                          <Stack.Screen name="+not-found" />
                        </Stack>
                        <MiniPlayer />
                        <Sidebar />
                      </View>
                    </ThemeProvider>
                  </DrawerProvider>
                </ContributionsProvider>
              </FavoritesProvider>
            </PlayerProvider>
          </HistoryProvider>
        </DataProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
