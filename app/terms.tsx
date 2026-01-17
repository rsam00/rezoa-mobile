import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsOfUseScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#000']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#a78bfa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Use</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 17, 2026</Text>

        <Section title="1. Agreement to Terms">
          <Text style={styles.text}>
            By accessing or using Rezoa, you agree to be bound by these Terms of Use. If you do not agree, please do not use the application.
          </Text>
        </Section>

        <Section title="2. Community Contributions">
          <Text style={styles.text}>
            Rezoa allows users to suggest radio programs and stations. You agree not to submit any content that is illegal, offensive, defamatory, or infringes on the intellectual property rights of others.
          </Text>
          <Text style={styles.text}>
            Rezoa reserves the right to review, modify, or remove any community contributions at our discretion.
          </Text>
        </Section>

        <Section title="3. Content Ownership">
          <Text style={styles.text}>
            The radio streams accessible through Rezoa are the property of their respective broadcasters. Rezoa acts only as a directory and player for these publicly available streams.
          </Text>
          <Text style={styles.text}>
            Rezoa branding, software, and community data are the property of Rezoa.
          </Text>
        </Section>

        <Section title="4. Disclaimers">
          <Text style={styles.text}>
            Rezoa is provided "as is" and "as available". We do not warrant that streams will be uninterrupted, error-free, or always available. Radio broadcast availability depends on the source broadcaster.
          </Text>
        </Section>

        <Section title="5. Limitation of Liability">
          <Text style={styles.text}>
            In no event shall Rezoa be liable for any indirect, incidental, special, or consequential damages arising out of your use of the application.
          </Text>
        </Section>

        <Section title="6. Changes to Terms">
          <Text style={styles.text}>
            We may modify these terms at any time. Your continued use of the app after changes are posted constitutes acceptance of the new terms.
          </Text>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Rezoa. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#a78bfa',
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
