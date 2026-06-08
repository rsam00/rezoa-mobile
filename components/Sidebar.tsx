import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { useDrawer } from '../contexts/DrawerContext';


export default function Sidebar() {
  const { isOpen, closeDrawer } = useDrawer();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const insets = useSafeAreaInsets();
  const sidebarWidth = Math.min(screenWidth * 0.8, 300);
  
  const translateX = useSharedValue(-sidebarWidth);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withTiming(-sidebarWidth, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen, sidebarWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleNav = (path: any) => {
    closeDrawer();
    router.push(path);
  };

  const handleAuth = async () => {
    if (user) {
      await signOut();
      closeDrawer();
    } else {
      closeDrawer();
      router.push('/login');
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {isOpen && (
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}

      <Animated.View style={[styles.container, animatedStyle, { width: sidebarWidth }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1e1b4b' }]} />
        
        <ScrollView 
          style={[styles.content, { 
            paddingTop: isLandscape ? Math.max(20, insets.top + 20) : insets.top + 60,
            paddingLeft: isLandscape ? Math.max(20, insets.left + 20) : 20
          }]} 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, isLandscape && { marginBottom: 20 }]}>
            <Image 
              source={require('../assets/images/logo-sidebar.png')} 
              style={[styles.logoImage, isLandscape && { width: 110, height: 40, marginBottom: 10 }]} 
              resizeMode="contain"
            />
            {user && (
              <View style={[styles.userProfile, isLandscape ? { flexDirection: 'row', padding: 10, gap: 10 } : {}]}>
                <View style={[styles.avatar, isLandscape && { width: 32, height: 32, borderRadius: 16 }]}>
                  <Text style={[styles.avatarText, isLandscape && { fontSize: 14 }]}>{user.email?.[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.authButton} onPress={handleAuth} activeOpacity={0.8}>
              <LinearGradient
                colors={user ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] : ['#a78bfa', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.authButtonText, user ? { color: '#ef4444' } : { color: '#fff' }]}>
                {user ? 'Sign Out' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.legalLinksRow}>
              <TouchableOpacity onPress={() => handleNav('/terms')}>
                <Text style={styles.legalFooterText}>Terms</Text>
              </TouchableOpacity>
              <Text style={styles.legalFooterDot}>•</Text>
              <TouchableOpacity onPress={() => handleNav('/privacy')}>
                <Text style={styles.legalFooterText}>Privacy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.version}>Rezoa v1.0.0 Alpha</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
    elevation: 10,
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  content: {
    flex: 1,
    paddingRight: 20, // left padding is handled dynamically
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 50,
    marginBottom: 20,
  },
  userProfile: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    gap: 12,
    width: '100%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userEmail: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuItems: {
    flex: 1,
  },
  authButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  authButtonText: {
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  legalFooterText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
  legalFooterDot: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
  },
  version: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
