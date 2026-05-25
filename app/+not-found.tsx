import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

export default function NotFoundScreen() {
  const pathname = usePathname();
  const { playerState } = usePlayer();
  
  useEffect(() => {
    // Log the unhandled deep link for debugging (e.g. from TrackPlayer notification)
    console.log('[NotFound] Unhandled route intercepted:', pathname);
  }, [pathname]);

  // In a mobile app, users don't type URLs. Any unrecognized deep link 
  // (such as the default intent fired by clicking the TrackPlayer notification)
  // should gracefully return the user to the current station if one is playing,
  // or fallback to the Home screen.
  
  if (playerState.currentStation) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Redirect href={`/station-details?id=${playerState.currentStation.id}`} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Redirect href="/" />
    </>
  );
}
