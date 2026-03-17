import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/store/ThemeContext';
import { siteContent } from '@/services/auth.service';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HelpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await siteContent();
      setContent(response.data);
    } catch (error) {
      console.error('Error loading help content:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const faqs = content?.faqs || [
    { question: "How do I book a Pandit?", answer: "Go to the 'Pandits' tab, select a Pandit, choose your service, and pick an available slot." },
    { question: "How do I pay for my booking?", answer: "We support Khalti, eSewa, and major cards. You can pay during the checkout process." },
    { question: "Can I cancel a booking?", answer: "Yes, you can cancel from your booking details page at least 24 hours before the scheduled time." },
    { question: "What is Samagri recommendations?", answer: "Our AI analyzes your chosen Puja and suggests all necessary ritual items you might need." }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.supportCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.supportTitle}>How can we help?</Text>
            <Text style={styles.supportSubtitle}>Search our help center or contact our support team directly.</Text>
            <TouchableOpacity 
              style={styles.contactBtn}
              onPress={() => router.push('/(customer)/help-contact' as any)}
            >
              <Text style={styles.contactBtnText}>Contact Support</Text>
              <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          
          {faqs.map((faq: any, index: number) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <View style={styles.questionRow}>
                <Text style={[styles.question, { color: colors.text }]}>{faq.question}</Text>
                <Ionicons 
                  name={expandedIndex === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.text + '50'} 
                />
              </View>
              {expandedIndex === index && (
                <View style={styles.answerContainer}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.answer, { color: colors.text + '80' }]}>{faq.answer}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.footerInfo}>
            <Text style={[styles.footerText, { color: colors.text + '50' }]}>Version 1.0.4 (Stable)</Text>
            <TouchableOpacity><Text style={{ color: colors.primary }}>Privacy Policy</Text></TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  supportCard: { padding: 24, borderRadius: 20, marginBottom: 30 },
  supportTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  supportSubtitle: { color: '#FFF', fontSize: 14, opacity: 0.9, marginBottom: 20, lineHeight: 20 },
  contactBtn: { 
    backgroundColor: '#FFF', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  contactBtnText: { color: '#FF6F00', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  faqItem: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  questionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  question: { fontSize: 15, fontWeight: '600', flex: 1, paddingRight: 10 },
  answerContainer: { paddingHorizontal: 18, paddingBottom: 18 },
  divider: { height: 1, marginBottom: 15 },
  answer: { fontSize: 14, lineHeight: 22 },
  footerInfo: { alignItems: 'center', marginTop: 40, gap: 10 },
  footerText: { fontSize: 12 },
});
