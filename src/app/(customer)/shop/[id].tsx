import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { useCartStore } from '@/store/cart.store';
import { fetchSamagriItems, checkWishlistStatus, toggleWishlist } from '@/services/samagri.service';
import { SamagriItem } from '@/services/api';
import { useTheme } from '@/store/ThemeContext';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, updateQuantity, getItemCount } = useCartStore();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<SamagriItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<SamagriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const items = await fetchSamagriItems();
      const found = items.find(p => String(p.id) === String(id));
      setProduct(found || null);

      if (found) {
        // Check wishlist status
        try {
          const { is_favorite } = await checkWishlistStatus(found.id);
          setIsFavorite(is_favorite);
        } catch (wishErr) {
          console.warn('Could not fetch wishlist status');
        }

        // Filter for related products
        const related = items.filter(p => 
          String(p.id) !== String(id) && 
          (p.category === found.category)
        ).slice(0, 4);
        
        if (related.length < 4) {
          const others = items.filter(p => 
            String(p.id) !== String(id) && 
            !related.find(r => r.id === p.id)
          ).slice(0, 4 - related.length);
          setRelatedProducts([...related, ...others]);
        } else {
          setRelatedProducts(related);
        }
      }
    } catch (e) {
      console.error("Failed to load product", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || togglingWishlist) return;
    try {
      setTogglingWishlist(true);
      const res = await toggleWishlist(product.id);
      setIsFavorite(res.status === 'added' || res.is_favorite);
    } catch (err) {
      console.error('Wishlist toggle failed');
    } finally {
      setTogglingWishlist(false);
    }
  };

  const handleVariantToggle = (size: string) => {
    if (selectedSize === size) {
      setSelectedSize(null); // Deselect
    } else {
      setSelectedSize(size); // Select
    }
  };

  const cartQuantity = typeof id === 'string' ? getItemCount(id) : 0;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header overlay on image later? No, keep it clean */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-social-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleToggleWishlist}>
            <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={22} 
                color={isFavorite ? colors.secondary : colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: colors.card }]}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.productImage} contentFit="cover" />
          ) : (
            <Ionicons name="cube-outline" size={100} color={colors.text + '20'} />
          )}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>4.8</Text>
            <Text style={styles.reviewCount}>(217 Reviews)</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.brandName, { color: colors.text + '60' }]}>PanditYatra Premium</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.price, { color: colors.primary }]}>NPR {product.price}</Text>
              <Text style={[styles.originalPrice, { color: colors.text + '40' }]}>NPR {Math.round(product.price * 1.2)}</Text>
            </View>
          </View>

          {/* Sibling discounts / Tags */}
          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>-20% OFF</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#10B98110' }]}>
              <Text style={[styles.tagText, { color: '#10B981' }]}>In Stock</Text>
            </View>
          </View>

          {/* Size Picker */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Selection Variant</Text>
          <View style={styles.variantRow}>
            {['Small', 'Medium', 'Large'].map(size => (
              <TouchableOpacity 
                key={size} 
                onPress={() => handleVariantToggle(size)}
                style={[
                  styles.sizeChip, 
                  { borderColor: colors.border },
                  selectedSize === size && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
              >
                <Text style={[
                  styles.sizeText, 
                  { color: colors.text + '80' },
                  selectedSize === size && { color: '#FFF', fontWeight: 'bold' }
                ]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Utilities */}
          <View style={styles.utilRow}>
            <View style={styles.utilItem}>
              <View style={[styles.utilIcon, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.utilText, { color: colors.text }]}>100% Authentic</Text>
            </View>
            <View style={styles.utilItem}>
              <View style={[styles.utilIcon, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="leaf" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.utilText, { color: colors.text }]}>Eco-Friendly</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.text + '80' }]}>
            {product.description || 'Experience divine grace with our premium quality puja essentials. Sourced directly from authentic suppliers to ensure your spiritual journeys are pure and fulfilling.'}
          </Text>
          <TouchableOpacity style={{ marginTop: 8 }}><Text style={{ color: colors.primary, fontWeight: 'bold' }}>Read More</Text></TouchableOpacity>

          {/* You May Also Like Section */}
          <View style={styles.recommendationContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Puja Samagri You May Also Like</Text>
            </View>
            <View style={styles.recommendationGrid}>
              {relatedProducts.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.recommendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    setProduct(null); // Force reload effect
                    router.push(`/(customer)/shop/${item.id}`);
                  }}
                >
                  <View style={[styles.recommendImageWrapper, { backgroundColor: colors.background }]}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.recommendImg} contentFit="cover" />
                    ) : (
                      <Ionicons name="image-outline" size={30} color={colors.text + '20'} />
                    )}
                  </View>
                  <Text style={[styles.recommendName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.recommendPrice, { color: colors.primary }]}>NPR {item.price}</Text>
                  <TouchableOpacity 
                    style={[styles.miniAddBtn, { backgroundColor: colors.primary }]}
                    onPress={() => addToCart({ ...item, id: String(item.id) } as any)}
                  >
                    <Ionicons name="add" size={16} color="#FFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[
        styles.bottomBar, 
        { 
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', 
            borderTopColor: colors.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
            height: (insets.bottom > 0 ? 85 : 95) + insets.bottom,
        }
      ]}>
        <TouchableOpacity 
          style={[styles.cartIconBtn, { borderColor: colors.border, backgroundColor: isDark ? '#262626' : '#F9FAFB' }]}
          onPress={() => router.push('/(customer)/cart')}
        >
          <Ionicons name="bag-handle-outline" size={26} color={colors.text} />
          {cartQuantity > 0 && (
            <MotiView 
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={[styles.badge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.badgeText}>{cartQuantity}</Text>
            </MotiView>
          )}
        </TouchableOpacity>

        {cartQuantity > 0 ? (
          <View style={[styles.quantityContainer, { backgroundColor: isDark ? '#262626' : '#F3F4F6' }]}>
            <TouchableOpacity 
              style={[styles.qtyBtn, { backgroundColor: colors.background }]} 
              onPress={() => updateQuantity(String(product.id), cartQuantity - 1)}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.qtyLabel}>
              <Text style={[styles.qtyText, { color: colors.text }]}>{cartQuantity}</Text>
            </View>
 
            <TouchableOpacity 
              style={[styles.qtyBtn, { backgroundColor: colors.background }]} 
              onPress={() => updateQuantity(String(product.id), cartQuantity + 1)}
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.buyBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              addToCart({ ...product, id: String(product.id) } as any);
            }}
          >
            <Ionicons name="bag-add-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.buyBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
            style={[styles.checkoutBtn, { backgroundColor: cartQuantity > 0 ? colors.text : colors.primary }]}
            onPress={() => {
              if (cartQuantity === 0) {
                addToCart({ ...product, id: String(product.id) } as any);
              }
              router.push('/(customer)/cart');
            }}
        >
            <Ionicons 
                name={cartQuantity > 0 ? "arrow-forward" : "flash-outline"} 
                size={18} 
                color="#FFF" 
                style={{ marginRight: 6 }} 
            />
            <Text style={[styles.checkoutBtnText, { color: '#FFF' }]}>
                {cartQuantity > 0 ? 'Checkout' : 'Buy Now'}
            </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollContent: { paddingBottom: 120 },
  imageContainer: {
    width: width,
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%' },
  ratingBadge: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  ratingText: { fontWeight: 'bold', fontSize: 13 },
  reviewCount: { fontSize: 12, opacity: 0.5 },
  infoSection: { padding: 24, paddingTop: 32 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  productName: { fontSize: 24, fontWeight: 'bold' },
  brandName: { fontSize: 14, marginTop: 2 },
  price: { fontSize: 22, fontWeight: 'bold' },
  originalPrice: { fontSize: 14, textDecorationLine: 'line-through' },
  tagsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  variantRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  sizeChip: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  sizeText: { fontSize: 14 },
  utilRow: { flexDirection: 'row', gap: 24, marginBottom: 32 },
  utilItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  utilIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  utilText: { fontSize: 14, fontWeight: '500' },
  description: { lineHeight: 24, fontSize: 15 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cartIconBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  buyBtn: { 
    flex: 1.5, 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  buyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  quantityContainer: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    paddingHorizontal: 4,
    height: 56,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  qtyLabel: { alignItems: 'center', flex: 1 },
  qtyText: { fontSize: 18, fontWeight: 'bold' },
  checkoutBtn: { 
    flex: 1.2,
    height: 56,
    borderRadius: 16, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  checkoutBtnText: { fontSize: 15, fontWeight: 'bold' },
  recommendationContainer: { marginTop: 40, marginBottom: 20 },
  sectionHeader: { marginBottom: 16 },
  recommendationGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    gap: 12
  },
  recommendCard: {
    width: (width - 72) / 2, // Adjusted for padding
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    position: 'relative',
    marginBottom: 8,
  },
  recommendImageWrapper: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  recommendImg: { width: '100%', height: '100%' },
  recommendName: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  recommendPrice: { fontSize: 14, fontWeight: 'bold' },
  miniAddBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
