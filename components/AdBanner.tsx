import React from 'react';
import { DimensionValue, StyleSheet, Text, View } from 'react-native';

export default function AdBanner({ type = 'inline', height, width }: { type?: 'inline' | 'banner', height?: DimensionValue, width?: DimensionValue }) {
  // Temporarily disabled BannerAd to troubleshoot UI freezing
  return (
    <View style={[
      styles.container, 
      type === 'banner' ? styles.banner : styles.inline,
      height ? { height } : {},
      width ? { width } : {},
    ]}>
      <Text style={{ color: '#444', fontSize: 10 }}>Ad Placeholder</Text>
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
