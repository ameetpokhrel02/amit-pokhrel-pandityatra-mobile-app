import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useCart } from '@/store/CartContext';
import { fetchSamagriItems, SamagriItem } from '@/services/api';
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
    if(id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
      try {
          setLoading(true);
          // Fetch all items and find. In a real app with large catalog, we'd use a detail endpoint.
          const items = await fetchSamagriItems();
          const found = items.find(p => String(p.id) === String(id));
          setProduct(found || null);
      } catch(e) {
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
        <View style={[styles.imageContainer, { backgroundColor: isDark ? '#333' : '#FFF7ED' }]}>
           {product.image && (product.image.startsWith('http') || product.image.startsWith('file')) ? (
              <Image source={{ uri: product.image }} style={{ width: 200, height: 200, borderRadius: 8 }} resizeMode="contain" />
           ) : (
              <Ionicons name={product.image as any || "cube-outline"} size={120} color={colors.primary} />
           )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.category, { color: isDark ? '#AAA' : '#666' }]}>{product.category}</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{product.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: isDark ? '#AAA' : '#666' }]}>4.8 (120)</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>NPR {product.price}</Text>
            
            {cartQuantity > 0 ? (
               <View style={[styles.quantityControl, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                <TouchableOpacity 
                  style={[styles.qtyButton, { backgroundColor: colors.primary }]} 
                  onPress={handleDecrement}
                >
                  <Ionicons name="remove" size={20} color="#FFF" />
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: colors.text }]}>{cartQuantity}</Text>
                <TouchableOpacity style={[styles.qtyButton, { backgroundColor: colors.primary }]} onPress={handleIncrement}>
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
               <View style={[styles.quantityControlDisabled, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]}>
                  <Text style={[styles.qtyTextDisabled, { color: isDark ? '#AAA' : '#999' }]}>1</Text>
               </View>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: isDark ? '#CCC' : '#666' }]}>{product.description}</Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choice of Add On</Text>
          <View style={[styles.addOnItem, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
            <View style={styles.addOnInfo}>
              <Ionicons name="leaf-outline" size={24} color={isDark ? '#AAA' : '#666'} />
              <Text style={[styles.addOnName, { color: colors.text }]}>Extra Tulsi Leaves</Text>
            </View>
            <View style={styles.addOnPriceRow}>
              <Text style={[styles.addOnPrice, { color: isDark ? '#AAA' : '#666' }]}>+ NPR 50</Text>
              <TouchableOpacity>
                <Ionicons name="radio-button-off" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.addOnItem, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
            <View style={styles.addOnInfo}>
              <Ionicons name="water-outline" size={24} color={isDark ? '#AAA' : '#666'} />
              <Text style={[styles.addOnName, { color: colors.text }]}>Ganga Jal</Text>
            </View>
            <View style={styles.addOnPriceRow}>
              <Text style={[styles.addOnPrice, { color: isDark ? '#AAA' : '#666' }]}>+ NPR 100</Text>
              <TouchableOpacity>
                <Ionicons name="radio-button-off" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: isDark ? '#333' : '#F0F0F0' }]}>
        {cartQuantity > 0 ? (
           <TouchableOpacity style={[styles.viewCartButton, { backgroundColor: isDark ? '#444' : '#333' }]} onPress={() => router.push('/(customer)/cart')}>
            <Ionicons name="cart" size={20} color="#FFF" />
            <Text style={styles.addToCartText}>View Cart ({cartQuantity})</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.addToCartButton, { backgroundColor: colors.primary }]} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={20} color="#FFF" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
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
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
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
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    padding: 4,
  },
  quantityControlDisabled: {
     flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    padding: 4,
    paddingHorizontal: 12,
    height: 40,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonDisabled: {
    backgroundColor: '#CCC',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  qtyTextDisabled: {
    fontSize: 16,
    fontWeight: 'bold',
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
  addOnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  addOnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addOnName: {
    fontSize: 14,
  },
  addOnPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addOnPrice: {
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  addToCartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewCartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
