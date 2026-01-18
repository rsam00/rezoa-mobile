import React from 'react';
import { DimensionValue, StyleSheet, Text, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface AdBannerProps {
  type?: 'inline' | 'banner';
  height?: DimensionValue;
  width?: DimensionValue;
}

const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx';

export default function AdBanner({ type = 'inline', height, width }: AdBannerProps) {
  const [hasError, setHasError] = React.useState(false);

  if (hasError || !BannerAd) {
    return (
      <View style={[
        styles.container, 
        type === 'banner' ? styles.banner : styles.inline,
        { height: 50, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }
      ]}>
        <Text style={{ color: '#555', fontSize: 10 }}>Ad Unavailable</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container, 
      type === 'banner' ? styles.banner : styles.inline,
      height ? { height } : {},
      width ? { width } : {}
    ]}>
      <BannerAd
        unitId={adUnitId}
        size={type === 'banner' ? BannerAdSize.BANNER : BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.error('Ad failed to load: ', error);
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#18181b', // zinc-900
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)', // purple/20
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
