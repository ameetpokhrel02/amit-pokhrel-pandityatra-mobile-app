import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useCart } from '@/store/CartContext';
import { fetchSamagriItems, fetchSamagriCategories, aiRecommendSamagri } from '@/services/shop.service';
import { SamagriItem } from '@/services/api';
import { MotiView } from 'moti';
import { useTheme } from '@/store/ThemeContext';

export default function ShopScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addToCart, updateQuantity, getItemCount, totalItems, totalPrice } = useCart();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  // State for API data
  const [products, setProducts] = useState<SamagriItem[]>([]);
  const [categories, setCategories] = useState<{ id: number | string, name: string }[]>([{ id: 'All', name: 'All' }]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendedItems, setRecommendedItems] = useState<SamagriItem[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [pujaName, setPujaName] = useState('');

  const handleAIRecommend = async () => {
    if (!pujaName.trim()) {
      Alert.alert('Required', 'Please enter a puja name');
      return;
    }
    try {
      setLoadingRec(true);
      const data = await aiRecommendSamagri({ puja_name: pujaName });
      const items = Array.isArray(data) ? data : (data.recommended_items || []);

      if (items.length > 0) {
        setRecommendedItems(items);
        Alert.alert('Success', `Found ${items.length} recommended items.`);
      } else {
        Alert.alert('Info', 'No items found for this puja.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to get recommendations.');
    } finally {
      setLoadingRec(false);
    }
  };

  const addAllRecommended = () => {
    recommendedItems.forEach(item => {
      // Ensure we map id correctly if needed. Product context usually expects string id.
      addToCart({ ...item, id: String(item.id) } as any);
    });
    Alert.alert('Success', 'Added recommended items to cart');
    setRecommendedItems([]); // Clear after adding? Usefulness depends on UX.
  };

  // Fetch products and categories on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, categoriesData] = await Promise.all([
        fetchSamagriItems(),
        fetchSamagriCategories()
      ]);

      setProducts(itemsData);
      setCategories([{ id: 'All', name: 'All' }, ...categoriesData]);
    } catch (error: any) {
      console.error('Error loading shop data:', error);
      Alert.alert('Error', 'Failed to load shop items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'All'
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products.filter(p =>
      String(p.category) === selectedCategory &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shop Samagri & Books</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(customer)/shop/ai-recommend')}>
            <Ionicons name="sparkles" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(customer)/cart')}>
            <Ionicons name="cart-outline" size={24} color={colors.text} />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: isDark ? '#444' : '#E5E7EB' }]}>
          <Ionicons name="search-outline" size={20} color={isDark ? '#AAA' : '#666'} />
          <TextInput
            placeholder="Search for items..."
            style={[styles.searchInput, { color: colors.text }]}
            placeholderTextColor={isDark ? '#AAA' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* AI Recommendation */}
        <View style={[styles.suggestionCard, { backgroundColor: isDark ? '#332' : '#FFF7ED', borderColor: isDark ? '#553' : '#FDE68A' }]}>
          <View style={styles.suggestionHeader}>
            <Ionicons name="sparkles" size={16} color="#D97706" />
            <Text style={[styles.suggestionTitle, { color: isDark ? '#FBBF24' : '#92400E' }]}>AI Puja Recommendation</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <TextInput
              style={[styles.searchInput, {
                backgroundColor: isDark ? '#444' : '#FFF',
                height: 40,
                borderRadius: 8,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: isDark ? '#555' : '#DDD'
              }]}
              placeholder="Ex: Satyanarayan Puja"
              placeholderTextColor={isDark ? '#AAA' : '#888'}
              value={pujaName}
              onChangeText={setPujaName}
            />
            <TouchableOpacity
              style={[styles.addRecommendedButton, { backgroundColor: colors.primary, paddingHorizontal: 16, height: 40, justifyContent: 'center' }]}
              onPress={handleAIRecommend}
              disabled={loadingRec}
            >
              {loadingRec ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Ask AI</Text>}
            </TouchableOpacity>
          </View>

          {recommendedItems.length > 0 && (
            <TouchableOpacity
              style={[styles.addRecommendedButton, { backgroundColor: '#F59E0B', marginTop: 8 }]}
              onPress={addAllRecommended}
            >
              <Text style={styles.addRecommendedText}>Add {recommendedItems.length} Recommended Items</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryTab, { backgroundColor: isDark ? '#333' : '#F3F4F6' }, selectedCategory === String(cat.id) && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedCategory(String(cat.id))}
            >
              <Text style={[styles.categoryText, { color: isDark ? '#AAA' : '#4B5563' }, selectedCategory === String(cat.id) && styles.categoryTextSelected]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading products...</Text>
          </View>
        ) : (
          <View style={styles.productList}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Product</Text>
              <TouchableOpacity><Text style={{ color: '#999' }}>See All</Text></TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {filteredProducts.map((item, index) => {
                // const quantity = getItemCount(String(item.id)); // Not needed for card view unless we show +/-
                return (
                  <MotiView
                    key={item.id}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 50 }}
                    style={[styles.productCard, { backgroundColor: isDark ? '#1F1F1F' : '#FFF9F4', borderColor: isDark ? '#333' : '#FDE68A' }]}
                  >
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => router.push(`/(customer)/shop/${item.id}`)}
                    >
                      <View style={[styles.imageContainer, { backgroundColor: isDark ? '#2a2a2a' : '#FFF' }]}>
                        {item.image && (item.image.startsWith('http') || item.image.startsWith('file')) ? (
                          <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                        ) : (
                          <View style={[styles.placeholderImage, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
                            <Ionicons name="image-outline" size={40} color={isDark ? '#555' : '#CCC'} />
                          </View>
                        )}
                        <TouchableOpacity style={styles.heartButton}>
                          <Ionicons name="heart-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.cardContent}>
                        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>

                        <View style={styles.priceRow}>
                          {/* Mocking original price for UI effect as requested */}
                          <Text style={[styles.originalPrice, { textDecorationLine: 'line-through', color: '#999', fontSize: 12 }]}>
                            NPR {Math.round(item.price * 1.2)}
                          </Text>
                          <Text style={[styles.productPrice, { color: colors.text }]}>NPR {item.price}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
                      onPress={() => addToCart({ ...item, id: String(item.id) } as any)}
                    >
                      <Ionicons name="bag-handle-outline" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </MotiView>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Cart Bar */}
      {totalItems > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: isDark ? '#333' : '#F3F4F6' }]}>
          <View>
            <Text style={[styles.totalItemsText, { color: isDark ? '#AAA' : '#666' }]}>{totalItems} Items</Text>
            <Text style={[styles.totalPriceText, { color: colors.text }]}>Total: NPR {totalPrice}</Text>
          </View>
          <TouchableOpacity style={[styles.checkoutButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(customer)/cart')}>
            <Text style={styles.checkoutButtonText}>Go to Checkout</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom bar
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  suggestionCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestionText: {
    fontSize: 13,
    marginBottom: 12,
  },
  addRecommendedButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addRecommendedText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFF',
  },
  productList: {
    paddingHorizontal: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productCard: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    // elevation: 1, // Optional, can remove if too much shadow
  },
  imageContainer: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
  },
  cardContent: {
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.6,
  },
  priceRow: {
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cleaned up unused styles
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
  },
  qtyButton: {
    padding: 4,
  },
  qtyText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginHorizontal: 8,
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    // paddingBottom: 30, // Adjust for safe area
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    elevation: 10,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalItemsText: {
    fontSize: 12,
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
