import { Stack } from 'expo-router';
import React from 'react';
import Sidebar from '../components/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { ContributionsProvider } from '../contexts/ContributionsContext';
import { DataProvider } from '../contexts/DataContext';
import { DrawerProvider } from '../contexts/DrawerContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { HistoryProvider } from '../contexts/HistoryContext';
import { PlayerProvider } from '../contexts/PlayerContext';
import MiniPlayer from './MiniPlayer';

export default function RootLayout() {
  return (
    <AuthProvider>
      <HistoryProvider>
        <ContributionsProvider>
          <DataProvider>
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
          </DataProvider>
        </ContributionsProvider>
      </HistoryProvider>
    </AuthProvider>
  );
}
