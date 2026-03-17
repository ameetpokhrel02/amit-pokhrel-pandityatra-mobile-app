import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/store/ThemeContext';
import { DailyPanchang } from '@/components/home/DailyPanchang';
import { useTranslation } from 'react-i18next';
import { fetchServices } from '@/services/puja.service';
import { listPandits } from '@/services/pandit.service';
import { listBookings } from '@/services/booking.service';
import { fetchBookingSamagriRecommendations } from '@/services/recommender.service';
import { getSamagriItems, getSamagriCategories } from '@/services/samagri.service';
import { useNotificationStore } from '@/store/notification.store';
import { Service, Pandit, Booking, SamagriItem, SamagriCategory } from '@/services/api';
import { getImageUrl } from '@/utils/image';

const { width } = Dimensions.get('window');

const BANNERS = [
  {
    id: 1,
    image: require('@/assets/images/hero 2.png'),
    title: 'Divine Shanti',
    subtitle: 'Spiritual Essentials & Holistic Goods'
  },
  {
    id: 2,
    image: require('@/assets/images/oils products.png'),
    title: 'Authentic Oils',
    subtitle: 'Pure & Energized Spiritual Oils'
  },
  {
    id: 3,
    image: require('@/assets/images/hero section 3.png'),
    title: 'Sacred Rituals',
    subtitle: 'Complete Samagri for Every Occasion'
  }
];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, syncProfile } = useAuthStore();
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const [services, setServices] = useState<Service[]>([]);
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recommendations, setRecommendations] = useState<SamagriItem[]>([]);
  const [samagriItems, setSamagriItems] = useState<SamagriItem[]>([]);
  const [samagriCategories, setSamagriCategories] = useState<SamagriCategory[]>([]);
  const { unreadCount, fetchNotifications: fetchStoreNotifications } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const { totalItems } = useCartStore();

  // Banner Carousel animation
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const flatListRef = React.useRef<any>(null);
  const currentIndexRef = React.useRef(0);

  useEffect(() => {
    loadHomeData();

    // Auto-slide logic (4 seconds)
    const interval = setInterval(() => {
      if (currentIndexRef.current < BANNERS.length - 1) {
        currentIndexRef.current += 1;
      } else {
        currentIndexRef.current = 0;
      }

      flatListRef.current?.scrollToIndex({
        index: currentIndexRef.current,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Guest-accessible data
      const [servicesData, panditsRes, samagriItemsRes, samagriCategoriesRes] = await Promise.all([
        fetchServices(),
        listPandits(),
        getSamagriItems(),
        getSamagriCategories(),
      ]);
      setServices(servicesData.slice(0, 6));
      setPandits(panditsRes.data.results || panditsRes.data.slice(0, 6));
      setSamagriItems(samagriItemsRes);
      setSamagriCategories(samagriCategoriesRes);

      // 2. Fetch authenticated data only if logged in and user object exists
      if (isAuthenticated && user) {
        try {
          // Sync profile to get latest name/photo/etc. from backend
          syncProfile();

          // Fetch notifications for unread count via store
          fetchStoreNotifications();

          const bookingsRes = await listBookings({ status: 'PENDING' });
          const bookingsData = bookingsRes.data;
          setBookings(bookingsData);

          if (bookingsData.length > 0) {
            try {
              const recoData = await fetchBookingSamagriRecommendations(bookingsData[0].id);
              setRecommendations(recoData);
            } catch (recoErr) {
              console.warn("Could not fetch recommendations", recoErr);
            }
          }
        } catch (authErr: any) {
          // Silent failure for session-related errors when not primary
          if (authErr?.response?.status === 401) {
            console.warn("Guest session unauthorized, skipping authenticated data");
          } else {
            console.error("Auth-only data fetch failed:", authErr);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load home data", error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBooking = bookings.length > 0 ? bookings[0] : null;

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F5F5F5' }]}>
      {/* Premium Header */}
      <View style={[styles.headerContainer, { backgroundColor: '#FFF' }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarBorder}>
            <Image
              source={{ uri: getImageUrl(user?.profile_pic_url) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerHello}>Hello, {user?.name?.split(' ')[0] || 'Amit'}</Text>
            <Text style={styles.headerGreeting}>{getTimeBasedGreeting()}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/(customer)/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: '#FF6F00' }]}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/(customer)/cart')}
          >
            <Ionicons name="bag-handle-outline" size={24} color="#333" />
            {totalItems > 0 && (
              <View style={[styles.cartBadgeHeader, { backgroundColor: '#FF6F00' }]}>
                <Text style={styles.cartBadgeTextHeader}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner Slider */}
        <View style={styles.carouselContainer}>
          <Animated.FlatList
            ref={flatListRef}
            data={BANNERS}
            renderItem={({ item }) => (
              <View style={styles.bannerItem}>
                <Image
                  source={item.image}
                  style={styles.bannerImage}
                  contentFit="cover"
                />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                  <TouchableOpacity
                    style={styles.bannerButton}
                    onPress={() => router.push('/(customer)/services')}
                  >
                    <Text style={styles.bannerButtonText}>Explore Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={item => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              currentIndexRef.current = Math.floor(event.nativeEvent.contentOffset.x / width);
            }}
          />
          <View style={styles.pagination}>
            {BANNERS.map((_, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 16, 8],
                extrapolate: 'clamp'
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp'
              });
              return (
                <Animated.View
                  key={i}
                  style={[styles.dot, { width: dotWidth, opacity, backgroundColor: '#FF6F00' }]}
                />
              );
            })}
          </View>
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

        {/* Featured Samagri by Category */}
        {samagriCategories.slice(0, 3).map(category => {
          const categoryItems = samagriItems.filter(item => item.category === category.id).slice(0, 5);
          if (categoryItems.length === 0) return null;

          return (
            <View key={category.id} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured {category.name}</Text>
                <TouchableOpacity onPress={() => router.push('/(customer)/shop' as any)}>
                  <Text style={[styles.seeAll, { color: '#FF6F00' }]}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                {categoryItems.map((item, index) => (
                  <SamagriCard key={item.id} item={item} index={index} colors={colors} isDark={isDark} router={router} />
                ))}
              </ScrollView>
            </View>
          );
        })}

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

      {/* Floating AI Guide Button - Roadmap requirement */}
      <TouchableOpacity 
        style={styles.floatingAiBtn}
        onPress={() => router.push('/(customer)/chat/ai-guide' as any)}
        activeOpacity={0.9}
      >
        <Ionicons name="sparkles" size={24} color="#FFF" />
        <Text style={styles.floatingAiText}>AI Guide</Text>
      </TouchableOpacity>
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
  const rating = pandit.rating && parseFloat(pandit.rating) > 0 ? pandit.rating : 'New';
  const name = pandit.user_details?.full_name || pandit.name || 'Pandit';
  const image = getImageUrl(pandit.user_details?.profile_pic_url || pandit.image) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

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
        <Text style={styles.panditExpHifi}>
          {pandit.experience_years || pandit.experience || '5'}+ Yrs Exp.
        </Text>
        <View style={styles.panditActionRow}>
          <Text style={styles.panditPriceHifi}>NPR {pandit.base_price || pandit.price || 500}</Text>
          <View style={styles.panditBookIcon}>
            <Ionicons name="arrow-forward" size={12} color="#FFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SamagriCard({ item, index, colors, isDark, router }: any) {
  const { addToCart } = useCartStore();
  return (
    <View style={styles.samagriCardWrapper}>
      <TouchableOpacity
        style={[styles.samagriCardHifi, { backgroundColor: isDark ? '#1F2937' : '#FFF', borderColor: isDark ? '#374151' : 'rgba(255, 111, 0, 0.08)' }]}
        onPress={() => router.push(`/(customer)/shop/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.samagriImageWrapper}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.samagriImageHifi}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.samagriImageHifi, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
              <Ionicons name="image-outline" size={30} color={colors.text + '20'} />
            </View>
          )}
        </View>
        <View style={styles.samagriInfoHifi}>
          <Text style={[styles.samagriNameHifi, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={styles.samagriActionRow}>
            <Text style={styles.samagriPriceHifi}>NPR {item.price}</Text>
            <TouchableOpacity
              style={styles.samagriAddBtn}
              onPress={() => addToCart({ ...item, id: String(item.id) } as any)}
            >
              <Ionicons name="add" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: '#FF00A8', // Magenta from reference
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  headerText: {
    justifyContent: 'center',
  },
  headerHello: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cartBadgeHeader: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cartBadgeTextHeader: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
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
  carouselContainer: {
    width: width,
    height: 220,
    marginBottom: 24,
  },
  bannerItem: {
    width: width,
    paddingHorizontal: 16,
    height: 200,
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  bannerOverlay: {
    position: 'absolute',
    left: 40,
    top: 30,
    right: 40,
  },
  bannerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  bannerSubtitle: { color: '#FFF', fontSize: 14, opacity: 0.9, marginBottom: 16 },
  bannerButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerButtonText: { color: '#FF6F00', fontWeight: 'bold', fontSize: 12 },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -20,
    gap: 6,
  },
  dot: { height: 8, borderRadius: 4 },
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
  samagriCardWrapper: {
    paddingBottom: 10,
  },
  samagriCardHifi: {
    width: 150,
    borderRadius: 20,
    marginRight: 16,
    padding: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  samagriImageWrapper: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  samagriImageHifi: {
    width: '100%',
    height: '100%',
  },
  samagriInfoHifi: {
    paddingHorizontal: 2,
  },
  samagriNameHifi: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  samagriActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  samagriPriceHifi: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  samagriAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
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
  floatingAiBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6F00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    elevation: 8,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  floatingAiText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
