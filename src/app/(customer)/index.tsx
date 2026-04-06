import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  RefreshControl,
  FlatList,
  StyleSheet,
  TextInput,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useNotificationStore } from '@/store/notification.store';
import { useTheme } from '@/store/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/utils/image';
import { DailyPanchang } from '@/components/home/DailyPanchang';
import { UpcomingSessionBanner } from '@/components/booking/UpcomingSessionBanner';
import { useDashboardData } from '@/hooks/customer/useDashboardData';
import { SamagriItem } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BANNERS = [
  {
    id: 1,
    image: require('@/assets/images/hero_2.png'),
    title: 'Divine Shanti',
    subtitle: 'Spiritual Essentials & Holistic Goods'
  },
  {
    id: 2,
    image: require('@/assets/images/oils_products.png'),
    title: 'Authentic Oils',
    subtitle: 'Pure & Energized Spiritual Oils'
  },
  {
    id: 3,
    image: require('@/assets/images/hero_3.png'),
    title: 'Sacred Rituals',
    subtitle: 'Complete Samagri for Every Occasion'
  }
];

// Helper for dynamic category icons
const getCategoryIcon = (name: string): any => {
  const n = name.toLowerCase();
  if (n.includes('vedic')) return 'book-open-variant';
  if (n.includes('marri') || n.includes('vivah')) return 'ring';
  if (n.includes('havan') || n.includes('fire')) return 'fire';
  if (n.includes('sanskar')) return 'heart-pulse';
  if (n.includes('birth')) return 'cake-variant';
  if (n.includes('death') || n.includes('shrad')) return 'feather';
  return 'flower-tulip';
};

export default function CustomerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const { totalItems, addToCart } = useCartStore();
  const { unreadCount } = useNotificationStore();

  const {
    services,
    categories,
    bookings,
    samagriItems,
    wishlist,
    loading,
    refreshing,
    onRefresh,
    handleToggleWishlist,
    handleAuthAction,
  } = useDashboardData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const filteredServices = useMemo(() => {
    let filtered = services;
    if (selectedCategoryId) {
      filtered = filtered.filter(s => s.category === selectedCategoryId);
    }
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [searchQuery, selectedCategoryId, services]);

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndexRef.current < BANNERS.length - 1) {
        currentIndexRef.current += 1;
      } else {
        currentIndexRef.current = 0;
      }
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: currentIndexRef.current,
          animated: true,
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const aromaItems = samagriItems.filter((item: SamagriItem) =>
    item.name.toLowerCase().includes('attar') ||
    item.name.toLowerCase().includes('oil') ||
    item.name.toLowerCase().includes('fragrance') ||
    item.name.toLowerCase().includes('incense')
  ).slice(0, 6);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border + '30' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(customer)/profile')}
          >
            <Image
              source={{ uri: getImageUrl(user?.profile_pic_url) || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.greetingLabel, { color: colors.text + '60' }]}>
              {getTimeBasedGreeting()}
            </Text>
            <Text style={[styles.greetingName, { color: colors.text }]}>
              Namaste, {user?.name?.split(' ')[0] || 'User'}!
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <HeaderActionBtn
            icon="notifications-outline"
            badgeCount={unreadCount}
            onPress={() => router.push('/notifications')}
            colors={colors}
            isDark={isDark}
          />
          <HeaderActionBtn
            icon="bag-handle-outline"
            badgeCount={totalItems}
            onPress={() => router.push('/(customer)/cart')}
            colors={colors}
            isDark={isDark}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* COMPONENT: VIDEO CALL REMINDER BANNER */}
        {bookings.length > 0 && <UpcomingSessionBanner booking={bookings[0]} role="customer" />}

        {/* Banner Carousel */}
        <View style={{ height: 200, marginBottom: 12, marginTop: 8 }}>
          <FlatList
            ref={flatListRef}
            data={BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
            onMomentumScrollEnd={(event) => {
              currentIndexRef.current = Math.floor(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            }}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20, height: 200 }}>
                <View style={[styles.bannerWrapper, { backgroundColor: isDark ? '#2A2A2E' : '#F4F4F5' }]}>
                  <Image
                    source={item.image}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    priority="high"
                  />
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                    <TouchableOpacity
                      style={styles.bannerBtn}
                      onPress={() => router.push('/(customer)/pandits')}
                    >
                      <Text style={[styles.bannerBtnText, { color: colors.primary }]}>Explore Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={item => item.id.toString()}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            removeClippedSubviews={Platform.OS === 'android'}
          />
        </View>

        {/* Quick Utilities Row */}
        <View style={styles.sectionWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.utilityRowScroller}>
            <UtilityItem title="Puja" icon="flame" onPress={() => router.push('/(customer)/services')} colors={colors} />
            <UtilityItem title="Find Pandit" icon="people" onPress={() => router.push('/(customer)/pandits')} colors={colors} />
            <UtilityItem title="Shop" icon="basket" onPress={() => router.push('/(customer)/shop')} colors={colors} />
            <UtilityItem title="Ask AI" icon="chatbubbles" onPress={() => handleAuthAction('/chat/ai-guide', { mode: 'ai' })} colors={colors} />
            <UtilityItem title="Kundali" icon="sparkles" onPress={() => handleAuthAction('/(customer)/kundali')} colors={colors} />
            <UtilityItem title="Panchang" icon="calendar" onPress={() => router.push('/(customer)/panchang' as any)} colors={colors} />
          </ScrollView>
        </View>

        {/* Home Search bar */}
        <View style={[styles.sectionWrap, { marginTop: 36 }]}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F3F4F6' }]}>
            <Ionicons name="search" size={20} color={colors.primary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search Sacred Rituals..."
              placeholderTextColor={isDark ? '#555' : '#999'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={isDark ? '#444' : '#CCC'} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Scrolling Category Filter */}
        <View style={{ height: 60, marginTop: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollFilter}>
            <TouchableOpacity
              style={[
                styles.catPill,
                !selectedCategoryId && { backgroundColor: Number(colors.primary) ? colors.primary : '#FF6F00', borderColor: colors.primary }
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <MaterialCommunityIcons name="flower-tulip" size={16} color={!selectedCategoryId ? '#FFF' : colors.primary} />
              <Text style={[styles.catPillText, !selectedCategoryId ? { color: '#FFF' } : { color: colors.text }]}>All</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catPill,
                  selectedCategoryId === cat.id && { backgroundColor: Number(colors.primary) ? colors.primary : '#FF6F00', borderColor: colors.primary }
                ]}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <MaterialCommunityIcons name={getCategoryIcon(cat.name)} size={16} color={selectedCategoryId === cat.id ? '#FFF' : colors.primary} />
                <Text style={[styles.catPillText, selectedCategoryId === cat.id ? { color: '#FFF' } : { color: colors.text }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Ritual Listing */}
        <View style={[styles.sectionWrap, { marginTop: 40 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ritual Discovery</Text>
            <Text style={[styles.foundCount, { color: colors.primary }]}>{filteredServices.length} found</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} router={router} colors={colors} isDark={isDark} />
              ))
            ) : (
              <View style={styles.emptyRitualWrap}>
                <Ionicons name="search-outline" size={40} color={isDark ? '#444' : '#DDD'} />
                <Text style={[styles.emptyRitualText, { color: isDark ? '#AAA' : '#666' }]}>No rituals found</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <DailyPanchang />

        {/* My Next Puja Card */}
        {bookings.length > 0 && bookings[0] && (
          <View style={[styles.sectionWrap, { marginTop: 40 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>My Next Puja</Text>
            <TouchableOpacity
              style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}
              onPress={() => router.push(`/(customer)/bookings/${bookings[0].id}` as any)}
            >
              <View style={styles.bookingCardTop}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text style={[styles.bookingTitle, { color: colors.text }]}>{bookings[0].service_name}</Text>
                  <Text style={[styles.bookingSubtitle, { color: colors.text + '60' }]}>with {bookings[0].pandit_full_name}</Text>
                </View>
                <View style={[
                    styles.statusBadge, 
                    { 
                        backgroundColor: (bookings[0].status === 'MISSED' || dayjs(`${bookings[0].booking_date} ${bookings[0].booking_time}`).add(1, 'hour').isBefore(dayjs())) 
                            ? (isDark ? '#3B1A1A' : '#FEE2E2') 
                            : (isDark ? '#3B2200' : '#FFF7ED'), 
                        borderColor: (bookings[0].status === 'MISSED' || dayjs(`${bookings[0].booking_date} ${bookings[0].booking_time}`).add(1, 'hour').isBefore(dayjs()))
                            ? (isDark ? '#5B2121' : '#FECACA')
                            : (isDark ? '#5B3A00' : '#FFEDD5')
                    }
                ]}>
                  <Text style={[
                      styles.statusText, 
                      { color: (bookings[0].status === 'MISSED' || dayjs(`${bookings[0].booking_date} ${bookings[0].booking_time}`).add(1, 'hour').isBefore(dayjs())) ? '#EF4444' : colors.primary }
                  ]}>
                      {(bookings[0].status === 'MISSED' || dayjs(`${bookings[0].booking_date} ${bookings[0].booking_time}`).add(1, 'hour').isBefore(dayjs())) ? 'MISSED' : bookings[0].status}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingDateRow}>
                <View style={styles.bookingDateItem}>
                  <View style={[styles.dateIconWrap, { backgroundColor: (bookings[0].status === 'MISSED' || dayjs(`${bookings[0].booking_date} ${bookings[0].booking_time}`).add(1, 'hour').isBefore(dayjs())) ? (isDark ? '#3B1A1A' : '#FEE2E2') : (isDark ? '#3B2200' : '#FFF7ED') }]}>
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                  </View>
                  <Text style={[styles.dateText, { color: colors.text + 'B0' }]}>{bookings[0].booking_date}</Text>
                </View>
                <View style={styles.bookingDateItem}>
                  <View style={[styles.dateIconWrap, { backgroundColor: isDark ? '#3B2200' : '#FFF7ED' }]}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                  </View>
                  <Text style={[styles.dateText, { color: colors.text + 'B0' }]}>{bookings[0].booking_time}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                    styles.joinBtn, 
                    { backgroundColor: (bookings[0].status === 'MISSED' || dayjs(`${bookings[0].booking_date} ${bookings[0].booking_time}`).add(1, 'hour').isBefore(dayjs())) ? '#A0AEC0' : colors.primary }
                ]}
                onPress={() => {
                    const isMissed = bookings[0].status === 'MISSED' || dayjs(`${bookings[0].booking_date} ${bookings[0].booking_time}`).add(1, 'hour').isBefore(dayjs());
                    if (!isMissed) {
                        router.push(`/(customer)/bookings/${bookings[0].id}` as any);
                    } else {
                        // Maybe show detail or handle as missed
                        router.push(`/(customer)/bookings/${bookings[0].id}` as any);
                    }
                }}
              >
                <Text style={styles.joinBtnText}>
                    {(bookings[0].status === 'MISSED' || dayjs(`${bookings[0].booking_date} ${bookings[0].booking_time}`).add(1, 'hour').isBefore(dayjs())) 
                        ? 'Session Missed' 
                        : 'Join Live Session'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}

        {/* Sacred Samagri Section */}
        <View style={[styles.sectionWrap, { marginTop: 40 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sacred Samagri</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/shop')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Shop All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
            {samagriItems.slice(0, 6).map((item) => (
              <SamagriCard
                key={item.id}
                item={item}
                isWishlisted={wishlist.includes(item.id)}
                onToggleWishlist={() => handleToggleWishlist(item.id)}
                onAdd={() => addToCart({ ...item, id: String(item.id) } as any)}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </ScrollView>
        </View>

        {/* Sacred Aroma & Attar */}
        {aromaItems.length > 0 && (
          <View style={[styles.sectionWrap, { marginTop: 40 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sacred Aroma & Attar</Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/shop')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Shop All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
              {aromaItems.map((item) => (
                <SamagriCard
                  key={item.id}
                  item={item}
                  isWishlisted={wishlist.includes(item.id)}
                  onToggleWishlist={() => handleToggleWishlist(item.id)}
                  onAdd={() => addToCart({ ...item, id: String(item.id) } as any)}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quote Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 48, marginBottom: 40 }}>
          <View style={[styles.quoteCard, { backgroundColor: isDark ? '#1C1C1E' : '#18181B' }]}>
            <Ionicons name="chatbubbles" size={120} color="rgba(255,255,255,0.03)" style={{ position: 'absolute', top: -40, left: -40 }} />
            <Text style={styles.quoteText}>
              &quot;Devotion is the bridge between the human and the divine.&quot;
            </Text>
            <View style={styles.quoteDivider} />
            <Text style={[styles.quoteAuthor, { color: colors.primary + '90' }]}>PanditYatra Spiritual Wisdom</Text>
          </View>
        </View>

        {/* App Feedback Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <TouchableOpacity 
            style={[styles.feedbackBanner, { backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F0F0F0' }]}
            onPress={() => router.push('/(customer)/reviews/app-reviews' as any)}
          >
            <View style={styles.feedbackBannerLeft}>
              <View style={[styles.feedbackIconWrap, { backgroundColor: colors.primary + '20', overflow: 'hidden' }]}>
                <Image 
                  source={require('@/assets/images/pandit-logo.png')} 
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>Love PanditYatra?</Text>
                <Text style={[styles.feedbackSubtitle, { color: colors.text + '80' }]}>Share your feedback with us</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '50'} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const HeaderActionBtn = React.memo(({ icon, badgeCount, onPress, colors, isDark }: { icon: any, badgeCount: number, onPress: () => void, colors: any, isDark: boolean }) => {
  return (
    <TouchableOpacity
      style={[styles.headerActionBtn, { backgroundColor: isDark ? '#2A2A2E' : '#F4F4F5', borderColor: isDark ? '#3A3A3E' : '#E4E4E7' }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={colors.text + 'B0'} />
      {badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const UtilityItem = React.memo(({ title, icon, onPress, colors }: { title: string, icon: any, onPress: () => void, colors: any }) => {
  return (
    <TouchableOpacity
      style={styles.utilityItem}
      onPress={onPress}
    >
      <View style={[styles.utilityIconWrap, { backgroundColor: colors.primary + '10' }]}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.utilityText, { color: colors.text + 'A0' }]}>{title}</Text>
    </TouchableOpacity>
  );
});

const ServiceCard = React.memo(({ service, router, colors, isDark }: any) => {
  return (
    <TouchableOpacity
      style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F0F0F0' }]}
      onPress={() => router.push({ pathname: '/(customer)/pandits', params: { searchQuery: service.name } })}
    >
      <View style={styles.serviceImageWrap}>
        <Image
          source={{ uri: getImageUrl(service.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=400' }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <View style={styles.featuredBadge}>
          <Text style={[styles.featuredText, { color: colors.primary }]}>Starting ₹{service.base_price}</Text>
        </View>
      </View>
      <View style={styles.serviceInfo}>
        <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>{service.name}</Text>
        <View style={styles.serviceBottom}>
          <View style={styles.durationTag}>
            <Ionicons name="time-outline" size={12} color={colors.primary} />
            <Text style={[styles.durationText, { color: colors.text + '80' }]}>{service.base_duration_minutes || 60} min</Text>
          </View>
          <View style={[styles.serviceArrow, { backgroundColor: isDark ? '#3B2200' : '#FFF7ED' }]}>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const SamagriCard = React.memo(({ item, isWishlisted, onToggleWishlist, onAdd, colors, isDark }: { item: SamagriItem, isWishlisted: boolean, onToggleWishlist: () => void, onAdd: () => void, colors: any, isDark: boolean }) => {
  return (
    <View
      style={[styles.samagriCard, { backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F0F0F0' }]}
    >
      <View style={[styles.samagriImageWrap, { backgroundColor: isDark ? '#2A2A2E' : '#F9FAFB' }]}>
        <Image
          source={{ uri: item.image || undefined }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <TouchableOpacity
          style={[styles.wishlistBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}
          onPress={onToggleWishlist}
        >
          <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.samagriInfo}>
        <Text style={[styles.samagriName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.samagriPrice, { color: colors.text }]}>₹{item.price}</Text>
          <Text style={[styles.samagriOldPrice, { color: colors.text + '40' }]}>₹{Math.round(item.price * 1.2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: colors.primary, borderColor: colors.background }]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#FF6F0030', padding: 2 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 999 },
  greetingLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  greetingName: { fontSize: 18, fontWeight: '900' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActionBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  badge: { position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', paddingHorizontal: 2 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  bannerWrapper: { width: '100%', height: '100%', borderRadius: 32, overflow: 'hidden' },
  bannerOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', padding: 32, justifyContent: 'center' },
  bannerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', marginBottom: 24, lineHeight: 20, width: '66%', textTransform: 'uppercase', letterSpacing: 2 },
  bannerBtn: { alignSelf: 'flex-start', backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
  bannerBtnText: { fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600'
  },
  categoryScrollFilter: {
    paddingHorizontal: 24,
    gap: 12,
    alignItems: 'center'
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#FF6F0020',
    gap: 8,
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '800'
  },
  foundCount: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyRitualWrap: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH - 48
  },
  emptyRitualText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8
  },
  utilityRowScroller: {
    paddingRight: 24,
    gap: 12,
    alignItems: 'center',
  },
  utilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  utilityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  utilityText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionWrap: { paddingHorizontal: 24, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  seeAllText: { fontWeight: '700', fontSize: 14 },
  bookingCard: { padding: 28, borderRadius: 48, borderWidth: 1 },
  bookingCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  bookingTitle: { fontSize: 24, fontWeight: '900', marginBottom: 6 },
  bookingSubtitle: { fontWeight: '700', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  statusText: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 },
  bookingDateRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 28 },
  bookingDateItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dateText: { fontWeight: '900', fontSize: 12 },
  joinBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  joinBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 3 },
  serviceCard: { width: 224, borderRadius: 40, overflow: 'hidden', borderWidth: 1 },
  serviceImageWrap: { width: '100%', height: 160, position: 'relative' },
  featuredBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  serviceInfo: { padding: 20 },
  serviceName: { fontWeight: '900', fontSize: 18, marginBottom: 4 },
  serviceBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  durationTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: 12, fontWeight: '700' },
  serviceArrow: { width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featuredText: { fontWeight: '900', fontSize: 10, textTransform: 'uppercase' },
  samagriCard: { borderRadius: 40, padding: 12, marginBottom: 8, borderWidth: 1, position: 'relative', width: (SCREEN_WIDTH - 64) / 1.8 },
  samagriImageWrap: { width: '100%', height: 176, borderRadius: 32, overflow: 'hidden', position: 'relative' },
  wishlistBtn: { position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  samagriInfo: { padding: 16, paddingTop: 20 },
  samagriName: { fontWeight: '900', fontSize: 16, marginBottom: 6 },
  samagriPrice: { fontWeight: '900', fontSize: 18 },
  samagriOldPrice: { fontSize: 12, fontWeight: '700', textDecorationLine: 'line-through' },
  addBtn: { position: 'absolute', bottom: -10, right: -10, width: 56, height: 56, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  quoteCard: { padding: 48, borderRadius: 56, alignItems: 'center', position: 'relative', overflow: 'hidden', backgroundColor: '#18181B' },
  quoteText: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontStyle: 'italic', fontSize: 18, lineHeight: 28, fontWeight: '500', paddingHorizontal: 16, marginBottom: 16 },
  quoteDivider: { width: 64, height: 6, borderRadius: 3, marginTop: 8, backgroundColor: '#FF6F00' },
  quoteAuthor: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 5, marginTop: 24 },
  feedbackBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, borderWidth: 1 },
  feedbackBannerLeft: { flexDirection: 'row', alignItems: 'center' },
  feedbackIconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  feedbackTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  feedbackSubtitle: { fontSize: 12, fontWeight: '500' },
});
