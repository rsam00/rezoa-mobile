import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDrawer } from '../contexts/DrawerContext';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  rightComponent?: React.ReactNode;
}

export default function TopNavigation({ rightComponent }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const { openDrawer } = useDrawer();
  const { user } = useAuth();

  // Determine current active tab based on route segments safely
  const currentRoute = Array.isArray(segments) && segments.length > 0 ? segments[segments.length - 1] : 'index';
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'Home', route: 'index' },
    { name: 'Guide', route: 'programguide' },
    { name: 'Explore', route: 'explore' },
  ];

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <>
      <View style={[
        styles.headerWrapper, 
        isLandscape ? [styles.headerWrapperLandscape, { width: 200 + Math.max(0, insets.left), paddingLeft: Math.max(0, insets.left) }] : {},
        { paddingTop: isLandscape ? insets.top + 10 : insets.top, height: isLandscape ? '100%' : insets.top + 60 }
      ]}>
        <View style={[styles.headerRow, isLandscape ? styles.headerRowLandscape : {}]}>
          <TouchableOpacity style={styles.profileButton} onPress={openDrawer}>
            {user?.email ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.email[0].toUpperCase()}</Text>
              </View>
            ) : (
              <Ionicons name="person-circle-outline" size={32} color="#a78bfa" />
            )}
          </TouchableOpacity>
      
      <View style={[styles.navContainer, isLandscape ? styles.navContainerLandscape : {}]}>
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

      {!isLandscape && (
        <View style={styles.rightContainer}>
          {rightComponent ? rightComponent : <View style={{ width: 44 }} />}
        </View>
      )}
      </View>
      </View>
    </>
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
  headerWrapperLandscape: {
    bottom: 0,
    right: 'auto',
    width: 200,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#121212',
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerRowLandscape: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 20,
    paddingHorizontal: 20,
  },
  profileButton: { 
    padding: 4 
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  navContainerLandscape: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    gap: 20,
  },
  navTab: {
    paddingHorizontal: 5, 
    paddingVertical: 6, 
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeNavTab: {
    borderBottomColor: '#a78bfa'
  },
  navTabText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
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
  },
});
