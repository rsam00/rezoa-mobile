import React from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = TestIds.BANNER;

interface AdBannerProps {
  type?: 'inline' | 'banner';
  height?: DimensionValue;
  width?: DimensionValue;
}

export default function AdBanner({ type = 'inline', height, width }: AdBannerProps) {
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
        onAdFailedToLoad={(error) => console.log('Ad failed to load: ', error)}
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
