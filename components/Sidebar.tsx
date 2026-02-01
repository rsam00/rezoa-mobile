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
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { useDrawer } from '../contexts/DrawerContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.375;

export default function Sidebar() {
  const { isOpen, closeDrawer } = useDrawer();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: isOpen ? 'auto' : 'none',
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
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
      </Animated.View>

      <Animated.View style={[styles.container, animatedStyle]}>
        <LinearGradient
          colors={['#1e1b4b', '#000']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Image 
              source={require('../assets/images/logo-sidebar.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
            {user && (
              <View style={styles.userProfile}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user.email?.[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.menuItems}>
            <View style={[styles.divider, { marginVertical: 20 }]} />
            
            <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <Text style={styles.authButtonText}>
                {user ? 'Sign Out' : 'Sign in'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={() => handleNav('/terms')} style={styles.legalItem}>
                <Text style={styles.legalText}>Terms of Use</Text>
              </TouchableOpacity>
              <View style={styles.legalSeparator} />
              <TouchableOpacity onPress={() => handleNav('/privacy')} style={styles.legalItem}>
                <Text style={styles.legalText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.version}>v1.0.0 Alpha</Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 30,
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
    padding: 20,
    borderRadius: 12,
    gap: 12,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  menuItems: {
    marginTop: 20,
    flex: 1,
  },
  authButton: {
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  authButtonText: {
    color: '#a78bfa',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  version: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  legalLinks: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  legalItem: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  legalText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  legalSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '80%',
  },
});
