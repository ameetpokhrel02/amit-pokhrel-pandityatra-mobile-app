import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator, Alert, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cart.store';
import { getSamagriItems, getSamagriCategories, getWishlist, toggleWishlist } from '@/services/samagri.service';
import { SamagriItem } from '@/services/api';
import { useTheme } from '@/store/ThemeContext';
import { getProfile } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

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

export default function ShopScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { addToCart, totalItems, totalPrice } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const isDark = theme === 'dark';

  const [products, setProducts] = useState<SamagriItem[]>([]);
  const [categories, setCategories] = useState<{ id: number | string, name: string }[]>([{ id: 'All', name: 'All' }]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('Devotee');
  const [wishlist, setWishlist] = useState<number[]>([]);

  // Banner Carousel animation
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    loadData();
    getUserInfo();

    // Auto-slide interval (4 seconds)
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
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load public data (items + categories) always
      const [itemsRes, categoriesRes] = await Promise.all([
        getSamagriItems(),
        getSamagriCategories(),
      ]);

      const itemsData = Array.isArray(itemsRes) ? itemsRes : (itemsRes as any)?.results || [];
      const categoriesData = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes as any)?.results || [];

      setProducts(itemsData);
      setCategories([{ id: 'All', name: 'All' }, ...categoriesData]);

      // Load wishlist ONLY if authenticated (requires token)
      if (isAuthenticated) {
        try {
          const wishlistRes = await getWishlist();
          const wishlistData = Array.isArray(wishlistRes) ? wishlistRes : (wishlistRes as any)?.results || [];
          // WishlistSerializer returns { id, item: { id, name, ... }, created_at }
          const ids = wishlistData.map((w: any) => w.item?.id || w.samagri_item?.id || w.id).filter(Boolean);
          setWishlist(ids);
        } catch (e) {
          console.log('Wishlist load skipped (auth issue)');
        }
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = async () => {
    try {
      const response = await getProfile();
      const profile = response.data;
      if (profile?.full_name) {
        setUserName(profile.full_name.split(' ')[0]);
      }
    } catch (e) {
      console.log('Using default username');
    }
  };

  const handleToggleWishlist = async (itemId: number) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please log in to add items to your wishlist.');
      return;
    }
    // Optimistic UI update
    const wasInWishlist = wishlist.includes(itemId);
    setWishlist(prev =>
      wasInWishlist ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
    try {
      await toggleWishlist(itemId);
    } catch (e) {
      // Revert on error
      setWishlist(prev =>
        wasInWishlist ? [...prev, itemId] : prev.filter(id => id !== itemId)
      );
      console.error('Failed to toggle wishlist:', e);
      Alert.alert('Error', 'Could not update wishlist. Please try again.');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || String(p.category) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderBanner = ({ item }: { item: typeof BANNERS[0] }) => (
    <View style={styles.bannerItem}>
      <Image 
        source={item.image} 
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
        <TouchableOpacity style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>Explore Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: SamagriItem }) => (
    <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.productTouchable}
        onPress={() => router.push(`/(customer)/shop/${item.id}`)}
      >
        <View style={[styles.imageWrapper, { backgroundColor: colors.background }]}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImg} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={40} color={colors.text + '20'} />
          )}
          <TouchableOpacity 
            style={styles.wishlistBtn}
            onPress={() => handleToggleWishlist(item.id)}
          >
            <Ionicons 
              name={wishlist.includes(item.id) ? "heart" : "heart-outline"} 
              size={18} 
              color={wishlist.includes(item.id) ? colors.secondary : colors.primary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, { color: colors.primary }]}>NPR {item.price}</Text>
            {/* Mock original price for premium feel */}
            <Text style={[styles.originalPrice, { color: colors.text + '40' }]}>NPR {Math.round(item.price * 1.2)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.addBtn, { backgroundColor: colors.primary }]}
        onPress={() => addToCart({ ...item, id: String(item.id) } as any)}
      >
        <Ionicons name="add" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.text + '80' }]}>Welcome back,</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconBox, { backgroundColor: colors.card }]}>
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconBox, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(customer)/wishlist' as any)}
          >
            <Ionicons name={wishlist.length > 0 ? "heart" : "heart-outline"} size={22} color={wishlist.length > 0 ? colors.primary : colors.text} />
            {wishlist.length > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.cartBadgeText}>{wishlist.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconBox, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(customer)/cart')}
          >
            <Ionicons name="bag-handle-outline" size={22} color={colors.text} />
            {totalItems > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={BANNERS}
            renderItem={renderBanner}
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
                  style={[styles.dot, { width: dotWidth, opacity, backgroundColor: colors.primary }]} 
                />
              );
            })}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
          <TouchableOpacity><Text style={{ color: colors.primary, fontWeight: '600' }}>See all</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={() => setSelectedCategory(String(cat.id))}
              style={[
                styles.categoryChip, 
                { backgroundColor: colors.card },
                selectedCategory === String(cat.id) && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
            >
              <Text style={[
                styles.categoryLabel, 
                { color: colors.text + '80' },
                selectedCategory === String(cat.id) && { color: '#FFF', fontWeight: 'bold' }
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dynamic Search during implementation */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.text + '40'} />
          <TextInput 
            placeholder="Search spiritual items..."
            placeholderTextColor={colors.text + '40'}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Product Grid */}
        <View style={styles.gridHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>New Arrivals</Text>
          <TouchableOpacity><Text style={{ color: colors.primary, fontWeight: '600' }}>Filters</Text></TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map(item => (
              <React.Fragment key={item.id}>
                {renderProduct({ item })}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky Cart Button */}
      {totalItems > 0 && (
        <TouchableOpacity 
          style={[styles.stickyCart, { backgroundColor: colors.secondary }]}
          onPress={() => router.push('/(customer)/cart')}
        >
          <View style={styles.stickyCartLeft}>
            <View style={styles.cartCircle}>
              <Ionicons name="bag-handle" size={20} color="#FFF" />
              <View style={styles.cartCount}><Text style={styles.cartCountText}>{totalItems}</Text></View>
            </View>
            <View>
              <Text style={styles.stickyCartTotal}>NPR {totalPrice}</Text>
              <Text style={styles.stickyCartSub}>Ready to order</Text>
            </View>
          </View>
          <View style={styles.stickyCartBtn}>
            <Text style={styles.stickyCartBtnText}>View Cart</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  welcomeText: { fontSize: 13, marginBottom: 2 },
  userName: { fontSize: 20, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 120 },
  carouselContainer: {
    width: width,
    height: 200,
    marginBottom: 24,
  },
  bannerItem: {
    width: width,
    paddingHorizontal: 20,
    height: 180,
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
  bannerSubtitle: { color: '#FFF', fontSize: 12, opacity: 0.9, marginBottom: 16 },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  categoriesList: { paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  categoryLabel: { fontSize: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  searchInput: { flex: 1, fontSize: 14 },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 50) / 2,
    borderRadius: 20,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
  },
  productTouchable: { flex: 1 },
  imageWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  productImg: { width: '100%', height: '100%' },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: { paddingHorizontal: 4 },
  productName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceText: { fontSize: 16, fontWeight: 'bold' },
  originalPrice: { fontSize: 12, textDecorationLine: 'line-through' },
  addBtn: {
    position: 'absolute',
    bottom: -8,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#F5F5F5', // Background color to "pop" it out
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stickyCart: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  stickyCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: { color: '#3E2723', fontSize: 10, fontWeight: 'bold' },
  stickyCartTotal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  stickyCartSub: { color: '#FFF', fontSize: 11, opacity: 0.8 },
  stickyCartBtn: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  stickyCartBtnText: { fontWeight: 'bold', fontSize: 13 },
});
