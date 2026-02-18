import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useCart } from '@/store/CartContext';
import { fetchSamagriItems } from '@/services/shop.service';
import { SamagriItem } from '@/services/api';
import { useTheme } from '@/store/ThemeContext';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, updateQuantity, getItemCount } = useCart();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [product, setProduct] = useState<SamagriItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // Fetch all items and find. In a real app with large catalog, we'd use a detail endpoint.
      const items = await fetchSamagriItems();
      const found = items.find(p => String(p.id) === String(id));
      setProduct(found || null);
    } catch (e) {
      console.error("Failed to load product", e);
    } finally {
      setLoading(false);
    }
  };

  // Local state for quantity display, initialized with cart quantity or 1
  const cartQuantity = typeof id === 'string' ? getItemCount(id) : 0;
  const [quantity, setQuantity] = useState(cartQuantity > 0 ? cartQuantity : 1);

  // Update local quantity when cart quantity changes
  useEffect(() => {
    if (cartQuantity > 0) {
      setQuantity(cartQuantity);
    }
  }, [cartQuantity]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Product not found</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    if (product) {
      addToCart({ ...product, id: String(product.id) } as any);
      router.push('/(customer)/cart');
    }
  };

  const handleIncrement = () => {
    if (product) {
      addToCart({ ...product, id: String(product.id) } as any);
    }
  };

  const handleDecrement = () => {
    if (typeof id === 'string') {
      updateQuantity(id, cartQuantity - 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="heart-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={[styles.imageContainer, { backgroundColor: isDark ? '#2a2a2a' : '#FFF7ED' }]}>
          {product.image && (product.image.startsWith('http') || product.image.startsWith('file')) ? (
            <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <Ionicons name={product.image as any || "cube-outline"} size={100} color={colors.primary} />
          )}
          <View style={styles.imageOverlayIcon}>
            <Ionicons name="bag-check-outline" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.category, { color: isDark ? '#AAA' : '#888' }]}>{product.category ? 'Puja Samagri' : 'General Item'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {/* Mocking original price */}
              <Text style={[styles.originalPrice, { textDecorationLine: 'line-through', color: '#999', fontSize: 14 }]}>
                NPR {Math.round(product.price * 1.2)}
              </Text>
              <Text style={[styles.price, { color: colors.primary }]}>NPR {product.price}</Text>
            </View>
          </View>

          {/* Select Size / Variant Mock to match UI reference */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Variant</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            {['Small', 'Medium', 'Large'].map((size, idx) => (
              <TouchableOpacity key={size} style={[styles.sizeOption, idx === 1 && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <Text style={[styles.sizeText, idx === 1 && { color: '#FFF' }]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Quantity</Text>
            <View style={[styles.quantityControl, { backgroundColor: isDark ? '#333' : '#F9FAFB', borderColor: isDark ? '#444' : '#E5E7EB', borderWidth: 1 }]}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={handleDecrement}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.text }]}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyButton} onPress={handleIncrement}>
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>About This Item</Text>
          <Text style={[styles.description, { color: isDark ? '#CCC' : '#666' }]}>
            {product.description || 'This is a premium quality item for your puja needs. It is sourced from the best suppliers and verified for authenticity.'}
            <Text style={{ fontWeight: 'bold' }}> Learn More</Text>
          </Text>

          {/* Keep Add On section as it is valuable functionality even if not in reference image */}
          {/* <Text style={[styles.sectionTitle, { color: colors.text }]}>Choice of Add On</Text>
          <View style={[styles.addOnItem, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}> ... </View> */}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: isDark ? '#333' : '#F0F0F0' }]}>
        <TouchableOpacity style={[styles.addToCartButton, { borderColor: colors.text, borderWidth: 1 }]} onPress={handleAddToCart}>
          <Ionicons name="add-circle-outline" size={20} color={colors.text} />
          <Text style={[styles.addToCartText, { color: colors.text }]}>Add To Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buyNowButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            addToCart({ ...product, id: String(product.id) } as any);
            router.push('/(customer)/cart');
          }}
        >
          <Ionicons name="bag-check" size={20} color="#FFF" />
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  category: {
    fontSize: 14,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Variant
  sizeOption: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  description: {
    lineHeight: 22,
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buyNowButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
