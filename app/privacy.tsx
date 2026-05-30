import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#1e1b4b', '#000']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top, height: 60 + insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#a78bfa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 70, maxWidth: 800, alignSelf: 'center', width: '100%' }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 17, 2026</Text>

        <Section title="1. Information We Collect">
          <Text style={styles.text}>
            We collect information you provide directly to us, such as when you create an account (Email), suggest radio programs, or heart a station.
          </Text>
          <Text style={styles.text}>
            We also automatically collect certain interaction data, including which stations you play or which shows you view, to power our community analytics (Trending and Popularity lists).
          </Text>
        </Section>

        <Section title="2. How We Use Your Information">
          <Text style={styles.text}>
            - To provide, maintain, and improve our services.{"\n"}
            - To aggregate anonymous community metrics (e.g., tracking "clicks" per show).{"\n"}
            - To synchronize your favorites across your devices (for logged-in users).{"\n"}
            - To communicate with you about updates to the platform.
          </Text>
        </Section>

        <Section title="3. Data Sharing and Third Parties">
          <Text style={styles.text}>
            We do not sell your personal data. We use Supabase for secure database management and authentication.
          </Text>
          <Text style={styles.text}>
            Please note that Rezoa streams content from external radio stations. Interacting with these streams may involve standard internet communication with third-party servers.
          </Text>
        </Section>

        <Section title="4. Your Rights">
          <Text style={styles.text}>
            You have the right to access, update, or delete your personal information at any time via your profile settings or by contacting our support.
          </Text>
        </Section>

        <Section title="5. Security">
          <Text style={styles.text}>
            We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.
          </Text>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Rezoa. All rights reserved.</Text>
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
