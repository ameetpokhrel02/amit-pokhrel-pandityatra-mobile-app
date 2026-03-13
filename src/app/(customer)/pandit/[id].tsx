import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { fetchPandit } from '@/services/pandit.service';
import { Pandit } from '@/types/pandit';
import { useTheme } from '@/store/ThemeContext';
import { getImageUrl } from '@/utils/image';

export default function PanditProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPandit = async () => {
      try {
        if (typeof id === 'string') {
          const data = await fetchPandit(Number(id));
          if (data) {
            const mappedPandit: Pandit = {
              id: String(data.id),
              name: data.user_details?.full_name || 'Unknown',
              image: getImageUrl(data.user_details?.profile_pic_url) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
              location: 'Kathmandu, Nepal',
              rating: data.rating || 5.0,
              reviewCount: data.review_count || 0,
              experience: data.experience_years || 0,
              isAvailable: data.is_available,
              bio: data.bio || '',
              specialization: data.expertise ? data.expertise.split(',').map(s => s.trim()) : [],
              languages: data.language ? data.language.split(',').map(s => s.trim()) : [],
              services: (data.services || []).map(s => ({
                id: s.id,
                name: s.puja_details?.name || 'Service',
                duration: s.duration_minutes,
                price: parseFloat(s.custom_price) || s.puja_details?.base_price || 0,
                image: s.puja_details?.image,
                description: s.puja_details?.description
              })),
              price: data.services && data.services.length > 0 ? Math.min(...data.services.map(s => parseFloat(s.custom_price))) : 500,
              isVerified: data.is_verified
            };
            setPandit(mappedPandit);
          }
        }
      } catch (e) {
        console.error('Failed to load pandit:', e);
      } finally {
        setLoading(false);
      }
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
    <View style={[styles.container, { backgroundColor: '#F5F5F5' }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: pandit.image }} style={styles.image} />
          <View style={styles.imageOverlay} />
          
          <View style={styles.headerTopActions}>
            <TouchableOpacity style={styles.headerCircleBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerCircleBtn}>
              <Ionicons name="share-social-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerInfoOverlay}>
            <View style={styles.topNameRow}>
              <Text style={styles.heroName}>{pandit.name}</Text>
              {pandit.isVerified && (
                <View style={styles.verifiedBadgeLarge}>
                  <Ionicons name="checkmark-circle" size={20} color="#FF6F00" />
                </View>
              )}
            </View>
            <View style={styles.locationTag}>
              <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationTextHero}>{pandit.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCardContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{pandit.rating}</Text>
              <View style={styles.statLabelRow}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.statLbl}>Rating</Text>
              </View>
            </View>
            <View style={styles.statVerticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{pandit.experience}+</Text>
              <Text style={styles.statLbl}>Exp Years</Text>
            </View>
            <View style={styles.statVerticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{pandit.reviewCount}</Text>
              <Text style={styles.statLbl}>Reviews</Text>
            </View>
            <View style={styles.statVerticalDivider} />
            <View style={styles.statBox}>
              <Ionicons 
                name={pandit.isAvailable ? "checkmark-circle" : "time"} 
                size={18} 
                color={pandit.isAvailable ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.statLbl, { color: pandit.isAvailable ? "#10B981" : "#EF4444", fontWeight: 'bold' }]}>
                {pandit.isAvailable ? "Available" : "Busy"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.section}>
            <Text style={styles.sectionHeaderTitle}>About Pandit ji</Text>
            <Text style={styles.aboutDescription}>
              {pandit.bio || `${pandit.name} is a renowned Vedic scholar with over ${pandit.experience} years of experience in performing sacred rituals.`}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.tagWrap}>
              {pandit.specialization.map((spec, i) => (
                <View key={i} style={styles.chipTag}>
                  <Text style={styles.chipText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.flexRowBetween}>
              <Text style={styles.sectionHeaderTitle}>Puja Services</Text>
              <Text style={styles.seeAllServices}>All Services</Text>
            </View>
            <View style={styles.serviceListColumn}>
              {(pandit.services || []).map((service, idx) => (
                <View key={idx} style={styles.serviceHifiCardComplex}>
                  <View style={styles.serviceHifiTop}>
                    <Image 
                      source={{ uri: getImageUrl(service.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=300' }} 
                      style={styles.serviceHifiImage} 
                    />
                    <View style={styles.serviceHifiContent}>
                      <Text style={styles.serviceHifiTitle}>{service.name}</Text>
                      <View style={styles.serviceHifiMetaRow}>
                        <Ionicons name="time-outline" size={12} color="#999" />
                        <Text style={styles.serviceHifiMeta}>{service.duration} Mins</Text>
                      </View>
                      <Text style={styles.serviceHifiPriceBadge}>NPR {service.price}</Text>
                    </View>
                  </View>
                  
                  {service.description && (
                    <Text style={styles.serviceHifiDesc} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}

                  <TouchableOpacity 
                    style={styles.serviceHifiBookBtn}
                    onPress={() => router.push(`/(customer)/booking?panditId=${pandit.id}&serviceId=${service.id}`)}
                  >
                    <Text style={styles.serviceHifiBookText}>Book Now</Text>
                    <Ionicons name="calendar-outline" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.flexRowBetween}>
              <Text style={styles.sectionHeaderTitle}>Recent Reviews</Text>
              <TouchableOpacity><Text style={styles.seeAllServices}>View All</Text></TouchableOpacity>
            </View>
            <View style={styles.reviewCardHifi}>
              <View style={styles.revTop}>
                <View style={styles.revUserRow}>
                  <View style={styles.revAvatar}><Text style={styles.revInitial}>R</Text></View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.revUserName}>Ramesh Khetri</Text>
                    <Text style={styles.revDate}>2 days ago</Text>
                  </View>
                </View>
                <View style={styles.revRatingBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.revRatingTxt}>5.0</Text>
                </View>
              </View>
              <Text style={styles.revComment}>
                Very peaceful and authentic recitation of mantras. Pandit ji explained every ritual's meaning which made it very special.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.hifiBottomBar}>
        <TouchableOpacity 
          style={styles.bottomChatBtn}
          onPress={() => router.push(`/(customer)/chat/${pandit.id}` as any)}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#FF6F00" />
          <Text style={styles.bottomChatText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.bottomBookBtn, !pandit.isAvailable && styles.bottomBookDisabled]}
          onPress={() => router.push(`/(customer)/booking?panditId=${pandit.id}`)}
          disabled={!pandit.isAvailable}
        >
          <Text style={styles.bottomBookText}>{pandit.isAvailable ? "Book Now" : "Busy Now"}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, marginBottom: 20 },
  scrollContent: { paddingBottom: 120 },
  
  // Header section
  imageContainer: { width: '100%', height: 420, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 1
  },
  headerTopActions: { 
    position: 'absolute', top: 50, left: 20, right: 20, 
    flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 
  },
  headerCircleBtn: { 
    width: 44, height: 44, borderRadius: 22, 
    backgroundColor: 'rgba(255,111,0, 0.4)', 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  headerInfoOverlay: { position: 'absolute', bottom: 60, left: 24, zIndex: 10 },
  topNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroName: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  verifiedBadgeLarge: { backgroundColor: '#FFF', borderRadius: 20, padding: 2 },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  locationTextHero: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },

  // Stats Card
  statsCardContainer: { marginTop: -40, paddingHorizontal: 20, zIndex: 20 },
  statsCard: { 
    backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 20, paddingHorizontal: 10,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20,
    elevation: 8, borderWidth: 1, borderColor: '#FF6F00' + '10'
  },
  statBox: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#3E2723', marginBottom: 2 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLbl: { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase' },
  statVerticalDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.05)' },

  // Content
  mainContent: { padding: 24, paddingTop: 32 },
  section: { marginBottom: 32 },
  sectionHeaderTitle: { fontSize: 20, fontWeight: 'bold', color: '#3E2723', marginBottom: 12 },
  aboutDescription: { fontSize: 15, color: '#3E2723' + '80', lineHeight: 24 },
  
  flexRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAllServices: { color: '#FF6F00', fontWeight: 'bold', fontSize: 14 },
  
  // Tags
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipTag: { 
    backgroundColor: '#FF6F00' + '10', paddingHorizontal: 14, paddingVertical: 8, 
    borderRadius: 12, borderWidth: 1, borderColor: '#FF6F00' + '20' 
  },
  chipText: { color: '#FF6F00', fontSize: 13, fontWeight: '600' },

  serviceListColumn: { gap: 12 },

  // Services Complex Card
  serviceHifiCardComplex: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,111,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  serviceHifiTop: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  serviceHifiImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  serviceHifiContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  serviceHifiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 4,
  },
  serviceHifiMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  serviceHifiMeta: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  serviceHifiPriceBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6F00',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  serviceHifiDesc: {
    fontSize: 13,
    color: '#3E2723' + '80',
    lineHeight: 18,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  serviceHifiBookBtn: {
    backgroundColor: '#FF6F00',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  serviceHifiBookText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Reviews
  reviewCardHifi: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  revTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  revUserRow: { flexDirection: 'row', alignItems: 'center' },
  revAvatar: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#9C1C1C', 
    justifyContent: 'center', alignItems: 'center' 
  },
  revInitial: { color: '#FFF', fontWeight: 'bold' },
  revUserName: { fontSize: 15, fontWeight: 'bold', color: '#3E2723' },
  revDate: { fontSize: 11, color: '#999' },
  revRatingBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, 
    backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 
  },
  revRatingTxt: { fontSize: 12, fontWeight: 'bold', color: '#FF6F00' },
  revComment: { fontSize: 14, color: '#3E2723' + '80', lineHeight: 22, fontStyle: 'italic' },

  // Bottom Bar
  hifiBottomBar: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: '#FFF', height: 100, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20,
    elevation: 20
  },
  bottomChatBtn: { 
    width: 70, height: 56, borderRadius: 18, borderWidth: 1.5, borderColor: '#FF6F00',
    justifyContent: 'center', alignItems: 'center'
  },
  bottomChatText: { fontSize: 10, fontWeight: 'bold', color: '#FF6F00', marginTop: 2 },
  bottomBookBtn: { 
    flex: 1, marginLeft: 16, height: 56, borderRadius: 18, backgroundColor: '#FF6F00',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF6F00', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15
  },
  bottomBookDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  bottomBookText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  backButton: { padding: 12, borderRadius: 8 },
  backButtonText: { color: '#FFF', fontWeight: 'bold' },
});
