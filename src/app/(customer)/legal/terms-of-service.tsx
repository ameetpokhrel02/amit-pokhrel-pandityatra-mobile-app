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

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.brandCard, { backgroundColor: colors.card, borderColor: '#80002033' }]}>
          <Image source={{ uri: LOGO_URL }} style={styles.logo} contentFit="contain" />
          <Text style={styles.appName}>PanditYatra</Text>
          <Text style={[styles.tagline, { color: colors.text + '99' }]}>Connecting Nepali Diaspora to Their Roots</Text>
          <Text style={[styles.updatedAt, { color: colors.text + '80' }]}>Last Updated: {lastUpdated}</Text>
        </View>

        <Section title="1. Acceptance of Terms">
          <Text style={[styles.paragraph, { color: colors.text }]}>By accessing or using PanditYatra, you agree to these Terms of Service. If you do not agree, please do not use the app.</Text>
        </Section>

        <Section title="2. Eligibility and Accounts">
          <Bullet text="You must provide accurate account information and keep it updated." />
          <Bullet text="You are responsible for safeguarding your login credentials and OTP access." />
          <Bullet text="You may not create accounts for unlawful or fraudulent activity." />
        </Section>

        <Section title="3. Services We Provide">
          <Bullet text="Pandit booking and scheduling in Nepal Time (UTC+5:45)." />
          <Bullet text="Samagri/books shopping with unified cart and delivery." />
          <Bullet text="Video puja sessions, call chat, and temporary recording access." />
          <Bullet text="AI-assisted recommendations and Kundali-related features." />
        </Section>

        <Section title="4. Payments and Pricing">
          <Text style={[styles.paragraph, { color: colors.text }]}>Payments are processed through third-party gateways including Khalti (NPR) and Stripe (USD). You authorize us to submit charges through your selected gateway.</Text>
          <Bullet text="All displayed prices are subject to taxes, processing, and delivery fees where applicable." />
          <Bullet text="Currency conversion is informational and may vary from final settlement rates." />
          <Bullet text="Refunds and cancellations follow service-specific policies shown at checkout or booking." />
        </Section>

        <Section title="5. Video Puja and Recording Terms">
          <Bullet text="You consent to camera/microphone usage for live puja sessions." />
          <Bullet text="Session recordings may be stored for up to 30 days for replay and quality review." />
          <Bullet text="You must not misuse video features for abusive, unlawful, or offensive behavior." />
        </Section>

        <Section title="6. User Conduct">
          <Bullet text="Respect pandits, vendors, and other users in chats and calls." />
          <Bullet text="Do not upload harmful, defamatory, or infringing content." />
          <Bullet text="Do not attempt to reverse engineer, disrupt, or exploit app systems." />
        </Section>

        <Section title="7. AI and Kundali Disclaimer">
          <Text style={[styles.paragraph, { color: colors.text }]}>AI suggestions and Kundali outputs are informational and spiritual in nature. They are not medical, legal, financial, or professional advice. Personal decisions remain your responsibility.</Text>
        </Section>

        <Section title="8. Intellectual Property">
          <Text style={[styles.paragraph, { color: colors.text }]}>The app, brand assets, logos, content structure, and software are owned by PanditYatra or licensed partners and are protected by applicable laws. Unauthorized copying or redistribution is prohibited.</Text>
        </Section>

        <Section title="9. Suspension and Termination">
          <Text style={[styles.paragraph, { color: colors.text }]}>We may suspend or terminate accounts that violate these terms, applicable law, or platform safety requirements. You may stop using the app at any time and request account deletion.</Text>
        </Section>

        <Section title="10. Limitation of Liability">
          <Text style={[styles.paragraph, { color: colors.text }]}>To the extent permitted by law, PanditYatra is not liable for indirect, incidental, special, or consequential damages arising from use of the app, third-party services, or network failures.</Text>
        </Section>

        <Section title="11. Governing Law and Disputes">
          <Text style={[styles.paragraph, { color: colors.text }]}>These terms are governed by the laws of Nepal. For EU users, mandatory consumer rights under local law remain unaffected. Disputes should first be raised through support for amicable resolution.</Text>
        </Section>

        <Section title="12. Changes to Terms">
          <Text style={[styles.paragraph, { color: colors.text }]}>We may revise these Terms from time to time. Material updates will be communicated in-app. Continued use after updates means you accept the revised terms.</Text>
        </Section>

        <Section title="13. Contact Information">
          <Text style={[styles.paragraph, { color: colors.text }]}>For legal or support questions, contact: pandityatra9@gmail.com</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>Support Number: +977 9847226995</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>WhatsApp Support: +977 9847226995</Text>
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
    color: '#800020',
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
    color: '#800020',
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
    borderLeftColor: '#800020',
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
