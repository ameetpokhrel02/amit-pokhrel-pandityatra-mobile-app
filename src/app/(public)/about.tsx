import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>About PanditYatra</Text>
      </View>

      <View style={styles.heroSection}>
        <Image 
          source={require('@/assets/images/hero_3.jpg')} 
          style={styles.heroImage} 
        />
        <Text style={styles.slogan}>Your Gateway to Vedic Traditions</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.text}>
          PanditYatra is dedicated to bridging the gap between devotees and authentic Vedic rituals. 
          We provide a seamless platform to book experienced Pandits, buy high-quality puja samagri, 
          and explore the spiritual wisdom of our ancestors.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What We Offer</Text>
        <View style={styles.offeringItem}>
          <Ionicons name="checkmark-circle" size={20} color="#f97316" />
          <Text style={styles.offeringText}>Verified & Experienced Pandits</Text>
        </View>
        <View style={styles.offeringItem}>
          <Ionicons name="checkmark-circle" size={20} color="#f97316" />
          <Text style={styles.offeringText}>Complete Puja Samagri Shop</Text>
        </View>
        <View style={styles.offeringItem}>
          <Ionicons name="checkmark-circle" size={20} color="#f97316" />
          <Text style={styles.offeringText}>Virtual Video Puja Assistance</Text>
        </View>
        <View style={styles.offeringItem}>
          <Ionicons name="checkmark-circle" size={20} color="#f97316" />
          <Text style={styles.offeringText}>Daily Panchang & Festival Alerts</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
  heroSection: { alignItems: 'center', marginBottom: 30 },
  heroImage: { width: '100%', height: 200, borderRadius: 15, marginBottom: 15 },
  slogan: { fontSize: 18, fontStyle: 'italic', color: '#f97316', fontWeight: '600' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#3E2723', marginBottom: 10 },
  text: { fontSize: 16, color: '#3E2723', lineHeight: 24 },
  offeringItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  offeringText: { fontSize: 16, color: '#3E2723', marginLeft: 10 },
});
