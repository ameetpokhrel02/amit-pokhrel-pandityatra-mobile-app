import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, MotiText } from 'moti';
import { Colors } from '@/constants/Colors';
import { PanditService } from '@/services/pandit.service';
import { Pandit } from '@/types/pandit';
import { useTheme } from '@/store/ThemeContext';

export default function PanditProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPandit = async () => {
      if (typeof id === 'string') {
        const data = await PanditService.getPanditById(id);
        setPandit(data || null);
      }
      setLoading(false);
    };
    loadPandit();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!pandit) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Pandit not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: pandit.image }} style={styles.image} />
          <View style={styles.overlay} />
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <MotiView
          from={{ translateY: 50, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          style={[styles.contentContainer, { backgroundColor: colors.background }]}
        >
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>{pandit.name}</Text>
              {pandit.isVerified && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
            </View>
            <Text style={[styles.location, { color: isDark ? '#AAA' : '#666' }]}>
              <Ionicons name="location" size={14} color={isDark ? '#AAA' : '#666'} /> {pandit.location}
            </Text>

            <View style={[styles.statsRow, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{pandit.rating} <Ionicons name="star" size={12} color="#FFD700" /></Text>
                <Text style={[styles.statLabel, { color: isDark ? '#AAA' : '#999' }]}>{pandit.reviewCount} Reviews</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{pandit.experience}+ Years</Text>
                <Text style={[styles.statLabel, { color: isDark ? '#AAA' : '#999' }]}>Experience</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{pandit.isAvailable ? 'Yes' : 'No'}</Text>
                <Text style={[styles.statLabel, { color: pandit.isAvailable ? 'green' : 'red' }]}>
                  {pandit.isAvailable ? 'Available' : 'Busy'}
                </Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: isDark ? '#CCC' : '#555' }]}>
              {pandit.bio || `${pandit.name} is a highly experienced Vedic scholar specializing in ${pandit.specialization.join(', ')}.`}
            </Text>
          </View>

          {/* Services Section */}
          {pandit.services && pandit.services.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Offered Services</Text>
              <View style={styles.verticalList}>
                {pandit.services.map((service) => (
                  <View key={service.id} style={[styles.serviceMiniCard, { backgroundColor: colors.card }]}>
                    <View>
                      <Text style={[styles.serviceMiniName, { color: colors.text }]}>{service.name}</Text>
                      <Text style={[styles.serviceMiniDetails, { color: isDark ? '#AAA' : '#666' }]}>
                        {service.duration} Mins • NPR {service.price}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.smallBookButton, { backgroundColor: colors.primary }]}
                      onPress={() => router.push(`/(customer)/booking?panditId=${pandit.id}&serviceId=${service.id}`)}
                    >
                      <Text style={styles.smallBookButtonText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Specializations */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Specializations</Text>
            <View style={styles.tagsContainer}>
              {pandit.specialization.map((spec, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: isDark ? '#332' : '#FFF3E0', borderColor: isDark ? '#443' : '#FFE0B2' }]}>
                  <Text style={[styles.tagText, { color: isDark ? '#FFB74D' : '#E65100' }]}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Languages</Text>
            <View style={styles.tagsContainer}>
              {pandit.languages.map((lang, index) => (
                <View key={index} style={[styles.langTag, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                  <Text style={[styles.langTagText, { color: isDark ? '#AAA' : '#666' }]}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews Preview (Mock) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.reviewCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={[styles.reviewerAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>R</Text>
                  </View>
                  <Text style={[styles.reviewerName, { color: colors.text }]}>Ramesh K.</Text>
                </View>
                <View style={[styles.reviewRating, { backgroundColor: isDark ? '#332' : '#FFF7ED' }]}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={[styles.reviewRatingText, { color: colors.text }]}>5.0</Text>
                </View>
              </View>
              <Text style={[styles.reviewText, { color: isDark ? '#CCC' : '#555' }]}>
                Very knowledgeable and punctual. The Griha Pravesh puja was conducted beautifully. Highly recommended!
              </Text>
            </View>
          </View>
        </MotiView>
      </ScrollView>

      {/* Bottom Action Bar */}
      <MotiView
        from={{ translateY: 100 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 300 }}
        style={[styles.bottomBar, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}
      >
        <View>
          <Text style={[styles.priceLabel, { color: isDark ? '#AAA' : '#999' }]}>Dakshina starts from</Text>
          <Text style={[styles.priceValue, { color: colors.primary }]}>NPR {pandit.price}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: colors.primary }, !pandit.isAvailable && styles.bookButtonDisabled]}
          onPress={() => router.push(`/(customer)/booking?panditId=${pandit.id}`)}
          disabled={!pandit.isAvailable}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </MotiView>
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
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    marginTop: -40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  headerInfo: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  seeAllText: {
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
  },
  langTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langTagText: {
    fontSize: 14,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  bookButtonDisabled: {
    backgroundColor: '#CCC',
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verticalList: {
    gap: 12,
  },
  serviceMiniCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  serviceMiniName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceMiniDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  smallBookButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallBookButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
