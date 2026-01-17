import { Stack } from 'expo-router';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { HistoryProvider } from '../contexts/HistoryContext';
import { PlayerProvider } from '../contexts/PlayerContext';
import MiniPlayer from './MiniPlayer';

export default function RootLayout() {
  return (
    <HistoryProvider>
      <PlayerProvider>
        <FavoritesProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="program-details" options={{ gestureEnabled: true, headerShown: false }} />
            <Stack.Screen name="station-details" options={{ gestureEnabled: true, headerShown: false }} />
          </Stack>
          <MiniPlayer />
        </FavoritesProvider>
      </PlayerProvider>
    </HistoryProvider>
  );
}
