import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { fetchServiceDetail } from '@/services/booking.service';
import { Service } from '@/services/api';
import { useTheme } from '@/store/ThemeContext';
import { MotiView } from 'moti';

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (id) {
      loadService();
    }
  }, [id]);

  const loadService = async () => {
    try {
      setLoading(true);
      const data = await fetchServiceDetail(Number(id));
      setService(data);
    } catch (error) {
      console.error("Failed to load service detail", error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>Service not found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.bookButton, { backgroundColor: colors.primary, width: 200, marginTop: 16 }]}
        >
          <Text style={styles.bookButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: service.image }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.infoCard}
          >
            <Text style={[styles.title, { color: colors.text }]}>{service.name}</Text>

            <View style={styles.statsRow}>
              <View style={[styles.statItem, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={[styles.statText, { color: colors.primary }]}>{service.base_duration || '2-3 Hours'}</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
                <Text style={[styles.statText, { color: '#10B981' }]}>Verified Puja</Text>
              </View>
            </View>

            <View style={styles.priceSection}>
              <Text style={[styles.priceLabel, { color: isDark ? '#AAA' : '#666' }]}>Starting from</Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>NPR {service.base_price}</Text>
            </View>
          </MotiView>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About this Service</Text>
            <Text style={[styles.description, { color: isDark ? '#BBB' : '#4B5563' }]}>
              {service.description || 'Experience a traditional and authentic puja ceremony performed by our expert pandits. We ensure all Vedic rituals are followed with precision and devotion.'}
            </Text>
          </View>

          {service.samagri_list && service.samagri_list.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Samagri</Text>
                <TouchableOpacity onPress={() => router.push('/(customer)/shop')}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Get Items</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.samagriList, { backgroundColor: colors.card, borderColor: isDark ? '#333' : '#F3F4F6' }]}>
                {service.samagri_list.map((item, index) => (
                  <View key={index} style={styles.samagriItem}>
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                    <Text style={[styles.samagriText, { color: colors.text }]}>
                      {typeof item === 'string' ? item : item.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What's Included</Text>
            <View style={styles.featureList}>
              {['Expert Pandit', 'Complete Ritual Guidance', 'Aarti & Prashad Ritual', 'Consultation (Pre-puja)'].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name="star" size={16} color={colors.primary} />
                  <Text style={{ marginLeft: 8, color: colors.text }}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#F3F4F6' }]}>
        <View style={styles.footerPrice}>
          <Text style={{ color: isDark ? '#AAA' : '#666', fontSize: 12 }}>Base Price</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>NPR {service.base_price}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push({
            pathname: '/(customer)/booking',
            params: { serviceId: service.id }
          })}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginVertical: 16,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    padding: 16,
    marginTop: -30,
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  priceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.8,
  },
  samagriList: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  samagriItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  samagriText: {
    fontSize: 14,
    fontWeight: '500',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  footerPrice: {
    flex: 1,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 54,
    borderRadius: 27,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
