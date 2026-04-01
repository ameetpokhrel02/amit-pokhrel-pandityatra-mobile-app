import React, { useState, useEffect, useRef } from 'react'; // Refreshed for routing
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  Dimensions, 
  Animated 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme/colors';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/store/ThemeContext';
import { SamagriItem, SamagriCategory } from '@/services/api';
import { useShopData } from '@/hooks/customer/useShopData';

const { width } = Dimensions.get('window');

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

export default function ShopScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { totalItems, addToCart } = useCartStore();
  
  const {
    loading,
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    wishlist,
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    handleToggleWishlist,
    filteredProducts,
  } = useShopData();

  // Banner Carousel animation
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
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

  const userName = user?.name ? user.name.split(' ')[0] : 'Guest';

  const renderProductItem = ({ item }: { item: SamagriItem }) => {
    const isOutOfStock = item.stock_quantity === 0;

    return (
      <View style={[styles.productCard, { backgroundColor: colors.card, opacity: isOutOfStock ? 0.7 : 1 }]}>
        <TouchableOpacity 
          style={styles.productTouchable}
          onPress={() => router.push(`/(customer)/shop/${item.id}`)}
        >
          <View style={[styles.imageWrapper, { backgroundColor: colors.background }]}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.productImg} contentFit="cover" />
            ) : (
              <Ionicons name="image-outline" size={40} color={colors.text + '20'} />
            )}
            
            {isOutOfStock && (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>Restocking Soon</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.wishlistBtn}
              onPress={() => handleToggleWishlist(item.id)}
            >
              <Ionicons 
                name={wishlist.includes(item.id) ? "heart" : "heart-outline"} 
                size={20} 
                color={wishlist.includes(item.id) ? colors.primary : colors.text} 
              />
            </TouchableOpacity>
          </View>
  
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.productPrice, { color: colors.primary }]}>₹{item.price}</Text>
            </View>
          </View>
        </TouchableOpacity>
  
        {!isOutOfStock && (
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => addToCart({ ...item, id: String(item.id) } as any)}
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderBannerItem = ({ item }: { item: any }) => (
    <View style={styles.bannerItem}>
      <Image 
        source={item.image} 
        style={styles.bannerImage}
        contentFit="cover"
      />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
        <TouchableOpacity style={styles.bannerBtn}>
          <Text style={styles.bannerBtnText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border + '20', borderBottomWidth: 1, backgroundColor: colors.card }]}>
        {!showSearch ? (
          <View style={styles.headerTitleRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                style={styles.avatarBtn}
                onPress={() => router.push('/(customer)/profile')}
              >
                <Image
                  source={{ uri: user?.profile_pic_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
              <View>
                <Text style={[styles.welcomeText, { color: colors.text + '80' }]}>Sacred Market,</Text>
                <Text style={[styles.userName, { color: colors.text }]}>{user?.name?.split(' ')[0] || 'Amit'}</Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                style={[styles.iconBox, { backgroundColor: colors.card }]}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search-outline" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconBox, { backgroundColor: colors.card }]}
                onPress={() => router.push('/(customer)/wishlist' as any)}
              >
                <Ionicons name="heart-outline" size={22} color={colors.text} />
                {wishlist.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{wishlist.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconBox, { backgroundColor: colors.card }]}
                onPress={() => router.push('/(customer)/cart')}
              >
                <Ionicons name="bag-handle-outline" size={22} color={colors.text} />
                {totalItems > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <TextInput
              style={[styles.searchInput, { color: colors.text, backgroundColor: colors.card }]}
              placeholder="Search samagri..."
              placeholderTextColor={colors.text + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.text + '60'} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Carousel */}
        {!showSearch && (
          <View style={styles.bannerSection}>
            <FlatList
              ref={flatListRef}
              data={BANNERS}
              renderItem={renderBannerItem}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
              keyExtractor={(item) => item.id.toString()}
            />
            {/* Pagination Dots */}
            <View style={styles.pagination}>
              {BANNERS.map((_, i) => {
                const opacity = scrollX.interpolate({
                  inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });
                return <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.primary, opacity }]} />;
              })}
            </View>
          </View>
        )}

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categories.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.name)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: selectedCategory === cat.name ? colors.primary : colors.card },
                  selectedCategory === cat.name && styles.activeChip
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  { color: selectedCategory === cat.name ? '#FFF' : colors.text }
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products Grid */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {showSearch ? `Results for "${searchQuery}"` : selectedCategory === 'All' ? 'Sacred Samagri' : selectedCategory}
            </Text>
            <Text style={[styles.itemCount, { color: colors.text + '60' }]}>
              {filteredProducts.length} items
            </Text>
          </View>

          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color={colors.text + '20'} />
                <Text style={[styles.emptyText, { color: colors.text + '60' }]}>No items found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 15, paddingTop: 12 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: '#FF6F0020' },
  avatarImage: { width: '100%', height: '100%' },
  welcomeText: { fontSize: 13, fontWeight: '500' },
  userName: { fontSize: 20, fontWeight: '800' },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  searchHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 },
  searchInput: { flex: 1, height: 44, borderRadius: 14, paddingHorizontal: 15, fontSize: 15, fontWeight: '500' },
  scrollContent: { paddingBottom: 20 },
  bannerSection: { marginVertical: 10 },
  bannerItem: { width: width, paddingHorizontal: 20, height: 180 },
  bannerImage: { width: '100%', height: '100%', borderRadius: 25 },
  bannerOverlay: { position: 'absolute', inset: 0, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 25, padding: 25, justifyContent: 'center' },
  bannerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 5 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 15 },
  bannerBtn: { backgroundColor: '#FFF', alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12 },
  bannerBtnText: { color: '#FF6F00', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  pagination: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 15 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  categoriesContainer: { marginVertical: 15 },
  categoriesScroll: { paddingHorizontal: 20, gap: 10 },
  categoryChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15 },
  activeChip: { elevation: 4, shadowColor: '#FF6F00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  categoryText: { fontSize: 13, fontWeight: '700' },
  productsSection: { paddingHorizontal: 20, marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  itemCount: { fontSize: 12, fontWeight: '600' },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 20 },
  productCard: { width: (width - 55) / 2, borderRadius: 25, padding: 10, position: 'relative' },
  productTouchable: { flex: 1 },
  imageWrapper: { width: '100%', height: 140, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  productImg: { width: '100%', height: '100%' },
  wishlistBtn: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  productInfo: { paddingHorizontal: 5 },
  productName: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, fontWeight: '900' },
  stockLabel: { fontSize: 10, color: '#EF4444', fontWeight: '700' },
  addBtn: { position: 'absolute', bottom: -5, right: -5, width: 40, height: 40, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FAFAFA' },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  outOfStockText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyContainer: { alignItems: 'center', marginTop: 50, gap: 15 },
  emptyText: { fontSize: 15, fontWeight: '600' }
});
