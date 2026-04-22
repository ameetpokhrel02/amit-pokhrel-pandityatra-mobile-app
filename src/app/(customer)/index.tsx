import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';

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
    subtitle: 'Spiritual Essentials & Holistic Goods',
    link: undefined as string | undefined
  },
  {
    id: 2,
    image: require('@/assets/images/oils_products.png'),
    title: 'Authentic Oils',
    subtitle: 'Pure & Energized Spiritual Oils',
    link: undefined as string | undefined
  },
  {
    id: 3,
    image: require('@/assets/images/hero_3.png'),
    title: 'Sacred Rituals',
    subtitle: 'Complete Samagri for Every Occasion',
    link: undefined as string | undefined
  }
];

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
  const { t } = useTranslation();
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
    refetch,
    handleToggleWishlist,
    handleAuthAction,
    banners: apiBanners
  } = useDashboardData();

  const lastFetchRef = useRef<number>(0);
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current > 30000) {
        refetch();
        lastFetchRef.current = now;
      }
    }, [refetch])
  );

  const dynamicBanners = useMemo(() => {
    if (apiBanners && apiBanners.length > 0) {
      return apiBanners.map(b => ({
        id: b.id,
        image: b.mobile_image_url || b.image_url,
        title: b.title,
        subtitle: b.description,
        link: b.link_url
      }));
    }
    return BANNERS;
  }, [apiBanners]);

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
      const count = dynamicBanners.length;
      if (count <= 1) return;
      currentIndexRef.current = (currentIndexRef.current + 1) % count;
      flatListRef.current?.scrollToIndex({ index: currentIndexRef.current, animated: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [dynamicBanners]);

  const getTimeBasedGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10),
        backgroundColor: colors.card, 
        borderBottomColor: colors.border + '30' 
      }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/(customer)/profile')}>
            <Image
              source={user?.profile_pic_url ? { uri: getImageUrl(user.profile_pic_url) || undefined } : require('@/assets/images/pandit-avatar.png')}
              style={styles.avatarImage}
              contentFit="cover"
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.greetingLabel, { color: colors.text + '60' }]}>{getTimeBasedGreeting()}!</Text>
            <Text style={[styles.greetingName, { color: colors.text }]}>Namaste, {user?.name?.split(' ')[0] || 'Soul'}!</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <HeaderActionBtn
            icon="notifications-outline"
            badgeCount={unreadCount}
            onPress={() => router.push('/notifications')}
            colors={colors}
          />
          <HeaderActionBtn
            icon="bag-handle-outline"
            badgeCount={totalItems}
            onPress={() => router.push('/(customer)/cart')}
            colors={colors}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {bookings.length > 0 && <UpcomingSessionBanner booking={bookings[0]} role="customer" />}

        {/* Banner Carousel */}
        <View style={{ height: 200, marginBottom: 12, marginTop: 8 }}>
          <FlatList
            ref={flatListRef}
            data={dynamicBanners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              currentIndexRef.current = Math.floor(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 20, height: 200 }}>
                <TouchableOpacity 
                    activeOpacity={0.9}
                    style={[styles.bannerWrapper, { backgroundColor: colors.card }]}
                    onPress={() => item.link ? router.push(item.link as any) : router.push('/(customer)/pandits')}
                >
                  <Image
                    source={typeof item.image === 'string' ? { uri: getImageUrl(item.image) } : item.image}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                    <View style={[styles.bannerBtn, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.bannerBtnText, { color: colors.primary }]}>Explore Now</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={item => item.id.toString()}
          />
        </View>

        {/* Quick Utilities */}
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

        {/* Search */}
        <View style={[styles.sectionWrap, { marginTop: 36 }]}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.primary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search Sacred Rituals..."
              placeholderTextColor={colors.text + '40'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Category Filter */}
        <View style={{ height: 60, marginTop: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollFilter}>
            <CategoryPill 
                label="All" 
                icon="flower-tulip" 
                active={!selectedCategoryId} 
                onPress={() => setSelectedCategoryId(null)} 
                colors={colors} 
            />
            {categories.map(cat => (
              <CategoryPill 
                key={cat.id} 
                label={cat.name} 
                icon={getCategoryIcon(cat.name)} 
                active={selectedCategoryId === cat.id} 
                onPress={() => setSelectedCategoryId(cat.id)} 
                colors={colors} 
              />
            ))}
          </ScrollView>
        </View>

        {/* Ritual Discovery */}
        <View style={[styles.sectionWrap, { marginTop: 40 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ritual Discovery</Text>
            <Text style={[styles.foundCount, { color: colors.primary }]}>{filteredServices.length} found</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {filteredServices.map(service => (
              <ServiceCard key={service.id} service={service} router={router} colors={colors} />
            ))}
          </ScrollView>
        </View>

        <DailyPanchang />

        {/* My Next Puja */}
        {bookings.length > 0 && (
          <View style={[styles.sectionWrap, { marginTop: 40 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>My Next Puja</Text>
            <TouchableOpacity
              style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/(customer)/bookings/${bookings[0].id}` as any)}
            >
              <View style={styles.bookingCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bookingTitle, { color: colors.text }]}>{bookings[0].service_name}</Text>
                  <Text style={[styles.bookingSubtitle, { color: colors.text + '60' }]}>with {bookings[0].pandit_full_name}</Text>
                </View>
              </View>
              <View style={[styles.joinBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.joinBtnText}>Join Live Session</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Samagri */}
        <Section title="Sacred Samagri" onSeeAll={() => router.push('/(customer)/shop')} colors={colors}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
            {samagriItems.slice(0, 6).map(item => (
              <SamagriCard
                key={item.id}
                item={item}
                isWishlisted={wishlist.includes(item.id)}
                onToggleWishlist={() => handleToggleWishlist(item.id)}
                onAdd={() => addToCart({ ...item, id: String(item.id) } as any)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </Section>

        {/* Aroma */}
        {aromaItems.length > 0 && (
          <Section title="Sacred Aroma & Attar" onSeeAll={() => router.push('/(customer)/shop')} colors={colors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
              {aromaItems.map(item => (
                <SamagriCard
                  key={item.id}
                  item={item}
                  isWishlisted={wishlist.includes(item.id)}
                  onToggleWishlist={() => handleToggleWishlist(item.id)}
                  onAdd={() => addToCart({ ...item, id: String(item.id) } as any)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* Quote */}
        <View style={{ paddingHorizontal: 24, marginTop: 48, marginBottom: 40 }}>
          <View style={[styles.quoteCard, { backgroundColor: isDark ? colors.card : '#18181B' }]}>
            <Text style={styles.quoteText}>&quot;Devotion is the bridge between the human and the divine.&quot;</Text>
            <View style={styles.quoteDivider} />
            <Text style={[styles.quoteAuthor, { color: colors.primary + '90' }]}>PanditYatra Spiritual Wisdom</Text>
          </View>
        </View>

        {/* App Feedback */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <TouchableOpacity 
            style={[styles.feedbackBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(customer)/reviews/app-reviews' as any)}
          >
            <View style={styles.feedbackBannerLeft}>
              <View style={[styles.feedbackIconWrap, { backgroundColor: colors.primary + '20' }]}>
                <Image source={require('@/assets/images/pandit-logo.png')} style={{ width: '100%', height: '100%' }} contentFit="cover" />
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

const HeaderActionBtn = ({ icon, badgeCount, onPress, colors }: any) => (
  <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
    <Ionicons name={icon} size={24} color={colors.text} />
    {badgeCount > 0 && (
      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
        <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const UtilityItem = ({ title, icon, onPress, colors }: any) => (
  <TouchableOpacity style={[styles.utilityItem, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
    <View style={[styles.utilityIconWrap, { backgroundColor: colors.primary + '10' }]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
    <Text style={[styles.utilityText, { color: colors.text }]}>{title}</Text>
  </TouchableOpacity>
);

const CategoryPill = ({ label, icon, active, onPress, colors }: any) => (
  <TouchableOpacity
    style={[styles.catPill, { borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    onPress={onPress}
  >
    <MaterialCommunityIcons name={icon} size={16} color={active ? '#FFF' : colors.primary} />
    <Text style={[styles.catPillText, { color: active ? '#FFF' : colors.text }]}>{label}</Text>
  </TouchableOpacity>
);

const ServiceCard = ({ service, router, colors }: any) => (
  <TouchableOpacity
    style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    onPress={() => router.push({ pathname: '/(customer)/pandits', params: { searchQuery: service.name } })}
  >
    <View style={styles.serviceImageWrap}>
      <Image 
        source={service.image ? { uri: getImageUrl(service.image) || undefined } : require('@/assets/images/pandit-logo.png')} 
        style={{ width: '100%', height: '100%' }} 
        contentFit="cover" 
      />
    </View>
    <View style={styles.serviceInfo}>
      <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>{service.name}</Text>
      <Text style={[styles.durationText, { color: colors.text + '80' }]}>Starting NPR {service.base_price}</Text>
    </View>
  </TouchableOpacity>
);

const SamagriCard = ({ item, isWishlisted, onToggleWishlist, onAdd, colors }: any) => (
  <View style={[styles.samagriCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.samagriImageWrap}>
      <Image 
        source={item.image ? { uri: getImageUrl(item.image) || undefined } : require('@/assets/images/pandit-logo.png')} 
        style={{ width: '100%', height: '100%' }} 
        contentFit="cover" 
      />
    </View>
    <View style={styles.samagriInfo}>
      <Text style={[styles.samagriName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.samagriPrice, { color: colors.text }]}>NPR {item.price}</Text>
    </View>
    <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={onAdd}>
      <Ionicons name="add" size={24} color="#FFF" />
    </TouchableOpacity>
  </View>
);

const Section = ({ title, onSeeAll, children, colors }: any) => (
  <View style={styles.sectionWrap}>
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll}><Text style={{ color: colors.primary, fontWeight: '700' }}>See All</Text></TouchableOpacity>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  greetingLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  greetingName: { fontSize: 18, fontWeight: '900' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActionBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  bannerWrapper: { width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden' },
  bannerOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', padding: 24, justifyContent: 'center' },
  bannerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 16 },
  bannerBtn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  bannerBtnText: { fontWeight: '900', fontSize: 11 },
  utilityRowScroller: { paddingRight: 24, gap: 12 },
  utilityItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, gap: 10, borderWidth: 1 },
  utilityIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  utilityText: { fontSize: 13, fontWeight: '800' },
  sectionWrap: { paddingHorizontal: 24, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  foundCount: { fontSize: 11, fontWeight: '800' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' },
  categoryScrollFilter: { paddingHorizontal: 24, gap: 10, alignItems: 'center' },
  catPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  catPillText: { fontSize: 12, fontWeight: '800' },
  serviceCard: { width: 160, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  serviceImageWrap: { width: '100%', height: 100 },
  serviceInfo: { padding: 12 },
  serviceName: { fontSize: 14, fontWeight: '900' },
  durationText: { fontSize: 11, marginTop: 4 },
  bookingCard: { padding: 20, borderRadius: 24, borderWidth: 1 },
  bookingCardTop: { marginBottom: 16 },
  bookingTitle: { fontSize: 18, fontWeight: '900' },
  bookingSubtitle: { fontSize: 12 },
  joinBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  joinBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  samagriCard: { width: 140, borderRadius: 20, borderWidth: 1, padding: 8, position: 'relative' },
  samagriImageWrap: { width: '100%', height: 100, borderRadius: 14, overflow: 'hidden' },
  samagriInfo: { marginTop: 8 },
  samagriName: { fontSize: 13, fontWeight: '800' },
  samagriPrice: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  addBtn: { position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  quoteCard: { padding: 32, borderRadius: 32, alignItems: 'center' },
  quoteText: { color: '#FFF', textAlign: 'center', fontStyle: 'italic', fontSize: 16, fontWeight: '500' },
  quoteDivider: { width: 40, height: 4, backgroundColor: '#f97316', marginVertical: 16, borderRadius: 2 },
  quoteAuthor: { fontSize: 12, fontWeight: '700' },
  feedbackBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, borderWidth: 1 },
  feedbackBannerLeft: { flexDirection: 'row', alignItems: 'center' },
  feedbackIconWrap: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden' },
  feedbackTitle: { fontSize: 15, fontWeight: '800' },
  feedbackSubtitle: { fontSize: 12 },
});
