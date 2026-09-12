import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from './SkeletonLoader';
import TopNavigation from './TopNavigation';

export default function HomeSkeleton() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const insets = useSafeAreaInsets();
  const heroHeight = isLandscape ? height * 0.8 : height * 0.55;

  return (
    <View style={styles.container}>
      <TopNavigation />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150, paddingTop: isLandscape ? insets.top : insets.top + 60, paddingRight: isLandscape ? Math.max(0, insets.right) : 0 }}
        style={isLandscape ? { marginLeft: 200 + Math.max(0, insets.left) } : {}}
      >
        <View style={[styles.heroContainer, { height: heroHeight }]}>
            <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
            <View style={styles.heroContent}>
               <Skeleton style={{ width: '60%', height: 30, marginBottom: 10 }} />
               <Skeleton style={{ width: '40%', height: 20, marginBottom: 20 }} />
               <View style={{ flexDirection: 'row', gap: 10 }}>
                 <Skeleton style={{ width: 140, height: 50, borderRadius: 25 }} />
                 <Skeleton style={{ width: 140, height: 50, borderRadius: 25 }} />
               </View>
            </View>
        </View>

        <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
           <Skeleton style={{ width: 150, height: 24, marginBottom: 15, borderRadius: 4 }} />
           <View style={{ flexDirection: 'row', gap: 12 }}>
             {[1, 2, 3].map(i => (
                <Skeleton key={i} style={{ width: 160, height: 100, borderRadius: 12 }} />
             ))}
           </View>
        </View>

        <View style={{ paddingHorizontal: 15, marginTop: 30 }}>
           <Skeleton style={{ width: 120, height: 24, marginBottom: 15, borderRadius: 4 }} />
           <View style={{ flexDirection: 'row', gap: 12 }}>
             {[1, 2, 3].map(i => (
                <Skeleton key={i} style={{ width: 160, height: 100, borderRadius: 12 }} />
             ))}
           </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  heroContainer: { width: '100%', position: 'relative' },
  heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 10 },
});
