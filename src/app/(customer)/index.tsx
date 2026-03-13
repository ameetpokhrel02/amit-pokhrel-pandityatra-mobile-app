import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useCart } from '@/store/CartContext';
import { useUser } from '@/store/UserContext';
import { useTheme } from '@/store/ThemeContext';
import { DailyPanchang } from '@/components/home/DailyPanchang';
import { useTranslation } from 'react-i18next';
import { fetchServices } from '@/services/puja.service';
import { fetchPandits } from '@/services/pandit.service';
import { fetchMyBookings } from '@/services/booking.service';
import { fetchBookingSamagriRecommendations } from '@/services/recommender.service';
import { Service, Pandit, Booking, SamagriItem } from '@/services/api';
import { getImageUrl } from '@/utils/image';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const [services, setServices] = useState<Service[]>([]);
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recommendations, setRecommendations] = useState<SamagriItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [servicesData, panditsData, bookingsData] = await Promise.all([
        fetchServices(),
        fetchPandits(),
        fetchMyBookings({ status: 'PENDING' }),
      ]);
      setServices(servicesData.slice(0, 6));
      setPandits(panditsData.slice(0, 6));
      setBookings(bookingsData);

      if (bookingsData.length > 0) {
        try {
          const recoData = await fetchBookingSamagriRecommendations(bookingsData[0].id);
          setRecommendations(recoData);
        } catch (recoErr) {
          console.warn("Could not fetch recommendations", recoErr);
        }
      }
    } catch (error) {
      console.error("Failed to load home data", error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBooking = bookings.length > 0 ? bookings[0] : null;

  return (
    <View style={[styles.container, { backgroundColor: '#F5F5F5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#FF6F00' }]}>
        <View>
          <Text style={[styles.greeting, { color: '#FFF' }]}>Namaste, {user?.name || 'Amit'} 🙏</Text>
          <Text style={[styles.subGreeting, { color: 'rgba(255,255,255,0.8)' }]}>Book authentic Vedic pujas</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextContent}>
            <Text style={styles.heroTitle}>Welcome to PanditYatra</Text>
            <Text style={styles.heroSubtitle}>Book trusted pandits{"\n"}for your pujas anytime</Text>
            <TouchableOpacity 
              style={styles.heroButton}
              onPress={() => router.push('/(customer)/services')}
            >
              <Text style={styles.heroButtonText}>Book Puja</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={require('@/assets/images/hero_3_photoroom.png')}
            style={styles.heroImage}
            contentFit="contain"
          />
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionContainer}>
          <View style={styles.quickActionsGrid2x3}>
            <QuickActionItem
              title="Book Puja"
              icon="color-filter-outline"
              color="#F97316"
              onPress={() => router.push('/(customer)/services')}
            />
            <QuickActionItem
              title="Find Pandit"
              icon="people-outline"
              color="#FF6F00"
              onPress={() => router.push('/(customer)/pandits')}
            />
            <QuickActionItem
              title="Shop Samagri"
              icon="basket-outline"
              color="#F97316"
              onPress={() => router.push('/(customer)/shop')}
            />
            <QuickActionItem
              title="Kundali"
              icon="sparkles-outline"
              color="#F97316"
              onPress={() => router.push('/(customer)/kundali')}
            />
            <QuickActionItem
              title="Panchang"
              icon="calendar-outline"
              color="#F97316"
              onPress={() => router.push('/(customer)/panchang' as any)}
            />
            <QuickActionItem
              title="Ask AI"
              icon="chatbubbles-outline"
              color="#F97316"
              onPress={() => router.push('/(customer)/chat')}
            />
          </View>
        </View>

        {/* Today's Panchang Widget */}
        <DailyPanchang />

        {/* Featured Services */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Pujas</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/services' as any)}>
              <Text style={[styles.seeAll, { color: '#FF6F00' }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            {services.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} colors={colors} isDark={isDark} router={router} />
            ))}
          </ScrollView>
        </View>

        {/* Top Pandits */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Pandits Near You</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/pandits' as any)}>
              <Text style={[styles.seeAll, { color: '#FF6F00' }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
            {pandits.map((pandit, index) => (
              <PanditCard key={pandit.id} pandit={pandit} index={index} colors={colors} isDark={isDark} router={router} />
            ))}
          </ScrollView>
        </View>

        {/* Upcoming Booking Card */}
        {upcomingBooking && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Upcoming Puja</Text>
            <View
              style={[styles.bookingCard, { backgroundColor: '#FFF', borderLeftColor: '#F97316' }]}
            >
              <View style={styles.bookingHeader}>
                <View>
                  <Text style={[styles.bookingService, { color: '#000' }]}>{upcomingBooking.service_name}</Text>
                  <Text style={[styles.bookingPandit, { color: '#666' }]}>with {upcomingBooking.pandit_full_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#FFF7ED' }]}>
                  <Text style={[styles.statusText, { color: '#FF6F00' }]}>{upcomingBooking.status}</Text>
                </View>
              </View>
              <View style={styles.bookingDetails}>
                <View style={styles.bookingDetailItem}>
                  <Ionicons name="calendar-outline" size={16} color="#F97316" />
                  <Text style={[styles.bookingDetailText, { color: '#333' }]}>{upcomingBooking.booking_date}</Text>
                </View>
                <View style={styles.bookingDetailItem}>
                  <Ionicons name="time-outline" size={16} color="#F97316" />
                  <Text style={[styles.bookingDetailText, { color: '#333' }]}>{upcomingBooking.booking_time}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.viewBookingButton, { borderColor: '#F97316' }]}
                onPress={() => router.push(`/(customer)/bookings/${upcomingBooking.id}` as any)}
              >
                <Text style={[styles.viewBookingText, { color: '#FF6F00' }]}>Join Puja</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* AI Samagri Recommended Section */}
        {recommendations.length > 0 && upcomingBooking && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#000' }]}>Recommended Samagri for {upcomingBooking.service_name}</Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/shop' as any)}>
                <Text style={[styles.seeAll, { color: '#FF6F00' }]}>Shop All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {recommendations.map((item, idx) => (
                <TouchableOpacity key={item.id} style={[styles.recoCard, { backgroundColor: '#FFF' }]}>
                  <Image source={{ uri: item.image }} style={styles.recoImage} />
                  <Text style={[styles.recoName, { color: '#000' }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.recoPrice}>NPR {item.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Spiritual Quote */}
        <View style={[styles.sectionContainer, styles.quoteSection]}>
          <View
            style={styles.quoteCard}
          >
            <Text style={styles.quoteText}>
              "Faith and devotion bring peace{"\n"}to the mind and soul."
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function ServiceCard({ service, index, colors, isDark, router }: any) {
  return (
    <View>
      <TouchableOpacity
        style={[styles.serviceCard, { backgroundColor: isDark ? '#1F2937' : '#FFF', borderColor: isDark ? '#374151' : '#F3F4F6' }]}
        onPress={() => router.push(`/(customer)/services/${service.id}`)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: getImageUrl(service.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=300' }}
          style={styles.serviceImage}
          contentFit="cover"
        />
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>{service.name}</Text>
          <Text style={styles.priceText}>NPR {service.base_price}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function PanditCard({ pandit, index, colors, isDark, router }: any) {
  const rating = pandit.rating && parseFloat(pandit.rating) > 0 ? pandit.rating : '4.5';
  const name = pandit.user_details?.full_name || 'Pandit';
  const image = getImageUrl(pandit.user_details?.profile_pic_url) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  
  return (
    <TouchableOpacity
      style={styles.panditCardHifi}
      onPress={() => router.push(`/(customer)/pandit/${pandit.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.panditImageWrapper}>
        <Image
          source={{ uri: image }}
          style={styles.panditImageHifi}
          contentFit="cover"
        />
        <View style={styles.panditRatingRibbon}>
          <Ionicons name="star" size={10} color="#FFD700" />
          <Text style={styles.panditRatingTxt}>{rating}</Text>
        </View>
      </View>
      <View style={styles.panditInfoHifi}>
        <Text style={styles.panditNameHifi} numberOfLines={1}>{name}</Text>
        <Text style={styles.panditExpHifi}>{pandit.experience_years || '5'}+ Yrs Exp.</Text>
        <View style={styles.panditActionRow}>
          <Text style={styles.panditPriceHifi}>NPR {pandit.price || 500}</Text>
          <View style={styles.panditBookIcon}>
            <Ionicons name="arrow-forward" size={12} color="#FFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function QuickActionItem({ title, icon, color, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.quickActionItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIconSmall, { backgroundColor: '#FFF' }]}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.quickActionTitleSmall}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subGreeting: {
    fontSize: 14,
    marginTop: 2,
  },
  heroBanner: {
    height: 220,
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderRadius: 24,
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  heroTextContent: {
    flex: 1,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6F00',
  },
  heroSubtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
    lineHeight: 30,
  },
  heroButton: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 20,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroImage: {
    width: 200,
    height: 220,
    position: 'absolute',
    right: -20,
    bottom: 0,
  },
  sectionContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsGrid2x3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
  },
  quickActionItem: {
    width: (Dimensions.get('window').width - 72) / 3,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIconSmall: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  quickActionTitleSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3E2723',
    textAlign: 'center',
    marginTop: 6,
  },
  horizontalList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  serviceCard: {
    width: 220,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  serviceImage: {
    width: '100%',
    height: 130,
  },
  serviceInfo: {
    padding: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF6F00',
  },
  panditCardHifi: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginRight: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 0, 0.08)',
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  panditImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  panditImageHifi: {
    width: '100%',
    height: '100%',
  },
  panditRatingRibbon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  panditRatingTxt: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  panditInfoHifi: {
    marginTop: 10,
    paddingHorizontal: 2,
  },
  panditNameHifi: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 2,
  },
  panditExpHifi: {
    fontSize: 11,
    color: '#9C1C1C',
    fontWeight: '600',
    marginBottom: 8,
  },
  panditActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panditPriceHifi: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  panditBookIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCard: {
    padding: 20,
    borderRadius: 24,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingService: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingPandit: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingDetailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewBookingButton: {
    borderWidth: 1.5,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  viewBookingText: {
    fontSize: 15,
    fontWeight: '700',
  },
  recoCard: {
    width: 130,
    borderRadius: 20,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recoImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    marginBottom: 10,
  },
  recoName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  recoPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  quoteSection: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  quoteCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
    color: '#444',
  },
});
