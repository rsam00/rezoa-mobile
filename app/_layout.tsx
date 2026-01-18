import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import Sidebar from '../components/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { ContributionsProvider } from '../contexts/ContributionsContext';
import { DataProvider, useData } from '../contexts/DataContext';
import { DrawerProvider } from '../contexts/DrawerContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { HistoryProvider } from '../contexts/HistoryContext';
import { PlayerProvider } from '../contexts/PlayerContext';
import MiniPlayer from './MiniPlayer';

export default function RootLayout() {
  React.useEffect(() => {
    try {
      if (typeof mobileAds === 'function') {
        mobileAds()
          .initialize()
          .then(adapterStatuses => {
            console.log('AdMob Initialized', adapterStatuses);
          })
          .catch(e => console.error('AdMob Init Error:', e));
      }
    } catch (error) {
      console.error('AdMob Error during init:', error);
    }
  }, []);

  return (
    <AuthProvider>
      <HistoryProvider>
        <ContributionsProvider>
          <DataProvider>
            <InnerLayout />
          </DataProvider>
        </ContributionsProvider>
      </HistoryProvider>
    </AuthProvider>
  );
}

function InnerLayout() {
  const { loading } = useData();

  React.useEffect(() => {
    // Hide splash screen immediately upon mounting to avoid "stuck" feeling
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <PlayerProvider>
      <FavoritesProvider>
        <DrawerProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="program-details" options={{ gestureEnabled: true, headerShown: false }} />
            <Stack.Screen name="station-details" options={{ gestureEnabled: true, headerShown: false }} />
            <Stack.Screen name="contribute-program" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
          <MiniPlayer />
          <Sidebar />
        </DrawerProvider>
      </FavoritesProvider>
    </PlayerProvider>
  );
}
