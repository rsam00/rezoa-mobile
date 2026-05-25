import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '../contexts/DrawerContext';

interface Props {
  rightComponent?: React.ReactNode;
}

export default function TopNavigation({ rightComponent }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const { openDrawer } = useDrawer();

  // Determine current active tab based on route segments safely
  const currentRoute = Array.isArray(segments) && segments.length > 0 ? segments[segments.length - 1] : 'index';
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'Home', route: 'index' },
    { name: 'Guide', route: 'programguide' },
    { name: 'Explore', route: 'explore' },
  ];

  return (
    <View style={[styles.headerWrapper, { paddingTop: insets.top, height: insets.top + 60 }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.profileButton} onPress={openDrawer}>
        <Text style={styles.profileButtonText}>☰</Text>
      </TouchableOpacity>
      
      <View style={styles.navContainer}>
        {tabs.map((tab) => {
          // Both `index` and `(tabs)` root can match Home
          const isActive = currentRoute === tab.route || (currentRoute === '(tabs)' && tab.route === 'index');
          return (
            <TouchableOpacity 
              key={tab.route} 
              style={[styles.navTab, isActive && styles.activeNavTab]}
              onPress={() => router.navigate(`/(tabs)/${tab.route === 'index' ? '' : tab.route}`)}
            >
              <Text style={[styles.navTabText, isActive && styles.activeNavTabText]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.rightContainer}>
        {rightComponent ? rightComponent : <View style={{ width: 44 }} />}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 100,
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  profileButton: { 
    padding: 4 
  },
  profileButtonText: { 
    color: '#a78bfa', 
    fontSize: 28, 
    fontWeight: '700' 
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  navTab: {
    paddingHorizontal: 15, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: '#1c1c1e'
  },
  activeNavTab: {
    backgroundColor: '#a78bfa'
  },
  navTabText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  activeNavTabText: {
    color: '#fff',
    fontWeight: '700',
  },
  rightContainer: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  }
});
