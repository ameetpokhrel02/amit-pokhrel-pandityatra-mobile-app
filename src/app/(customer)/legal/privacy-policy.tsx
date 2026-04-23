import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/store/ThemeContext';

const LOGO_URL = 'https://res.cloudinary.com/dm0vvpzs9/image/upload/v1775928132/PanditYatralogo_gr68of.png';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return <Text style={styles.bulletItem}>• {text}</Text>;
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#800020' }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.brandCard, { backgroundColor: colors.card, borderColor: '#FF993355' }]}>
          <Image source={{ uri: LOGO_URL }} style={styles.logo} contentFit="contain" />
          <Text style={[styles.appName, { color: '#800020' }]}>PanditYatra</Text>
          <Text style={[styles.tagline, { color: colors.text + '99' }]}>Connecting Nepali Diaspora to Their Roots</Text>
          <Text style={[styles.updatedAt, { color: colors.text + '80' }]}>Last Updated: {lastUpdated}</Text>
        </View>

        <Section title="1. Introduction">
          <Text style={[styles.paragraph, { color: colors.text }]}>PanditYatra ("we", "our", "us") is committed to protecting your personal data and privacy. This Privacy Policy explains how we collect, use, store, and share your information when you use our mobile app and related services.</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>This policy is designed to align with Nepal's Personal Data Protection Act 2079 and GDPR principles for users in the EU and worldwide Nepali diaspora.</Text>
        </Section>

        <Section title="2. Information We Collect">
          <Text style={[styles.paragraph, { color: colors.text }]}>We collect information you provide directly and information required to deliver app features.</Text>
          <Bullet text="Personal details: name, email, phone number, delivery address." />
          <Bullet text="Birth details for Kundali: date, time, and place of birth." />
          <Bullet text="Booking and transaction details for puja and samagri orders." />
          <Bullet text="Permissions data: camera, microphone, and location access." />
          <Bullet text="Communication data: in-app chat messages and support queries." />
          <Bullet text="Video call recordings saved to cloud storage for up to 30 days." />
          <Text style={[styles.paragraph, { color: colors.text }]}>Payment gateways (Khalti and Stripe) process your payment credentials. We do not store full card or wallet secrets.</Text>
        </Section>

        <Section title="3. How We Use Your Information">
          <Bullet text="Create and manage your account and profile." />
          <Bullet text="Process pandit bookings, schedules, and order deliveries." />
          <Bullet text="Enable payment processing, verification, and refunds." />
          <Bullet text="Generate Kundali and AI-based recommendations." />
          <Bullet text="Support video puja, chat, and recording playback." />
          <Bullet text="Send service alerts, reminders, and app notifications." />
          <Bullet text="Improve reliability, fraud prevention, and user experience." />
        </Section>

        <Section title="4. Legal Basis for Processing (GDPR)">
          <Bullet text="Consent: where you grant permission (location, camera, microphone, notifications)." />
          <Bullet text="Contract performance: to provide booked puja, orders, and app services." />
          <Bullet text="Legal obligation: compliance with tax, accounting, and lawful requests." />
          <Bullet text="Legitimate interests: service security, analytics, and product improvement." />
        </Section>

        <Section title="5. Data Sharing and Third Parties">
          <Text style={[styles.paragraph, { color: colors.text }]}>We share only what is required with trusted service providers, including:</Text>
          <Bullet text="Khalti and Stripe for payment processing." />
          <Bullet text="WebRTC/video infrastructure providers for live puja and recording." />
          <Bullet text="Firebase/notification infrastructure for push messaging and delivery." />
          <Bullet text="Hosting and cloud storage providers for secure app operations." />
          <Text style={[styles.paragraph, { color: colors.text }]}>We do not sell your personal data to advertisers or data brokers.</Text>
        </Section>

        <Section title="6. Data Retention">
          <Bullet text="Account and profile data: retained while your account remains active." />
          <Bullet text="Video call recordings: retained up to 30 days unless deletion is requested earlier." />
          <Bullet text="Chat and support records: retained up to 1 year for service quality and dispute resolution." />
          <Bullet text="Regulatory and financial records: retained as required by law." />
        </Section>

        <Section title="7. Your Rights">
          <Text style={[styles.paragraph, { color: colors.text }]}>You may request access, correction, deletion, portability, and limitation of your data. You may also withdraw consent for optional permissions at any time from device settings.</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>For account deletion requests, use the in-app delete option or contact support.</Text>
        </Section>

        <Section title="8. Children's Privacy">
          <Text style={[styles.paragraph, { color: colors.text }]}>PanditYatra is not intended for children under 13. We do not knowingly collect personal data from children under 13. If such data is discovered, we will remove it promptly.</Text>
        </Section>

        <Section title="9. Security Measures">
          <Bullet text="Encrypted API communication and secure token handling." />
          <Bullet text="Role-based access control and authentication safeguards." />
          <Bullet text="Operational monitoring and controlled infrastructure access." />
          <Bullet text="Secure storage practices for sensitive app data." />
        </Section>

        <Section title="10. International Transfers">
          <Text style={[styles.paragraph, { color: colors.text }]}>Because PanditYatra serves global users, data may be processed outside Nepal. We apply reasonable contractual and technical safeguards for cross-border transfers where required.</Text>
        </Section>

        <Section title="11. Changes to This Policy">
          <Text style={[styles.paragraph, { color: colors.text }]}>We may update this Privacy Policy periodically. Material changes will be communicated through app notifications or in-app banners. Continued use after updates means you accept the revised policy.</Text>
        </Section>

        <Section title="12. Contact Information">
          <Text style={[styles.paragraph, { color: colors.text }]}>For privacy requests or concerns, contact us at: support@pandityatra.com</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>If you are in the EU, you may also contact your local supervisory authority where applicable.</Text>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 18,
    paddingBottom: 36,
    gap: 14,
  },
  brandCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  updatedAt: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9933',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#800020',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 22,
    color: '#2B2B2B',
    marginBottom: 4,
    marginLeft: 2,
  },
});
