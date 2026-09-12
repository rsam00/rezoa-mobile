import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNavigation from '../components/TopNavigation';
import LanguageDropdown from '../components/LanguageDropdown';
import { useTranslation } from 'react-i18next';

export default function TermsOfUseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#1e1b4b', '#000']}
        style={StyleSheet.absoluteFill}
      />
      
      {isLandscape && <TopNavigation rightComponent={<LanguageDropdown />} />}

      <View style={[
        styles.header, 
        { paddingTop: insets.top, height: 60 + insets.top },
        isLandscape && { left: 200 + Math.max(0, insets.left) }
      ]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#a78bfa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('terms.title')}</Text>
        {!isLandscape && (
          <View style={{ position: 'absolute', right: Math.max(insets.right, 20), bottom: 10 }}>
            <LanguageDropdown />
          </View>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 70, maxWidth: 800, alignSelf: 'center', width: '100%' }]} 
        style={isLandscape ? { marginLeft: 200 + Math.max(0, insets.left) } : {}}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>{t('terms.lastUpdated')}</Text>

        <Section title={t('terms.sec1Title')}>
          <Text style={styles.text}>{t('terms.sec1P1')}</Text>
        </Section>

        <Section title={t('terms.sec2Title')}>
          <Text style={styles.text}>{t('terms.sec2P1')}</Text>
          <Text style={styles.text}>{t('terms.sec2P2')}</Text>
        </Section>

        <Section title={t('terms.sec3Title')}>
          <Text style={styles.text}>{t('terms.sec3P1')}</Text>
          <Text style={styles.text}>{t('terms.sec3P2')}</Text>
        </Section>

        <Section title={t('terms.sec4Title')}>
          <Text style={styles.text}>{t('terms.sec4P1')}</Text>
        </Section>

        <Section title={t('terms.sec5Title')}>
          <Text style={styles.text}>{t('terms.sec5P1')}</Text>
        </Section>

        <Section title={t('terms.sec6Title')}>
          <Text style={styles.text}>{t('terms.sec6P1')}</Text>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('terms.footer')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  lastUpdated: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 30,
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    marginBottom: 10,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
});
