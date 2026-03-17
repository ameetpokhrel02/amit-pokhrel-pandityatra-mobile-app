import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/store/ThemeContext';
import { fetchWishlist, toggleWishlist } from '@/services/samagri.service';
import { useCartStore } from '@/store/cart.store';
import { SamagriItem } from '@/services/api';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addToCart } = useCartStore();
  const [wishlistItems, setWishlistItems] = useState<SamagriItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await fetchWishlist();
      // Backend returns WishlistSerializer: { id, item: { id, name, ... }, created_at }
      // Extract the nested samagri item from each wishlist entry
      const items = (data || []).map((w: any) => w.item || w).filter(Boolean);
      setWishlistItems(items);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await toggleWishlist(id);
      setWishlistItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const renderItem = ({ item }: { item: SamagriItem }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.clickable}
        onPress={() => router.push(`/(customer)/shop/${item.id}`)}
      >
        <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={40} color={colors.text + '20'} />
          )}
          <TouchableOpacity 
            style={styles.removeBtn}
            onPress={() => handleRemove(item.id)}
          >
            <Ionicons name="heart" size={18} color={colors.secondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>NPR {item.price}</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.addBtn, { backgroundColor: colors.primary }]}
        onPress={() => addToCart({ ...item, id: String(item.id) } as any)}
      >
        <Ionicons name="cart-outline" size={18} color="#FFF" />
        <Text style={styles.addBtnText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-dislike-outline" size={80} color={colors.text + '20'} />
          <Text style={[styles.emptyText, { color: colors.text + '60' }]}>Your wishlist is empty</Text>
          <TouchableOpacity 
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(customer)/shop')}
          >
            <Text style={styles.shopBtnText}>Explore Shop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  list: { padding: 15 },
  columnWrapper: { justifyContent: 'space-between' },
  card: {
    width: (width - 45) / 2,
    borderRadius: 20,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  clickable: { flex: 1 },
  imageContainer: {
    width: '100%',
    height: 140,
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  image: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  info: { paddingHorizontal: 5 },
  name: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, marginTop: 15, marginBottom: 25, textAlign: 'center' },
  shopBtn: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  shopBtnText: { color: '#FFF', fontWeight: 'bold' },
});
