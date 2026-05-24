import React from 'react';
import { DimensionValue, StyleSheet, Text, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export default function AdBanner({ type = 'inline', height, width }: { type?: 'inline' | 'banner', height?: DimensionValue, width?: DimensionValue }) {
  // Use Test ID for development to prevent account suspension
  const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-3940256099942544/6300978111';

  return (
    <View style={[
      styles.container, 
      type === 'banner' ? styles.banner : styles.inline,
      height ? { height } : {},
      width ? { width } : {},
    ]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.error('[AdBanner] Failed to load ad:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#18181b', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)', 
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inline: {
    height: 80,
  },
  banner: {
    height: 50,
  },
});
