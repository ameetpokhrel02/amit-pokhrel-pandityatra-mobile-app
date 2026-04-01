import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { listVendorProducts, deleteProduct, VendorProduct } from '@/services/vendor.service';
import { getImageUrl } from '@/utils/image';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function VendorProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    try {
      const res = await listVendorProducts();
      const data = res.data?.results || res.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  const openDeleteModal = (id: number, name: string) => {
    setProductToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await deleteProduct(productToDelete.id);
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setDeleteModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const renderItem = ({ item }: { item: VendorProduct }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F0F0F0' }]}
      onPress={() => router.push({ pathname: '/(vendor)/products/[id]' as any, params: { id: item.id } })}
      activeOpacity={0.85}
    >
      <View style={[styles.imgWrap, { backgroundColor: isDark ? '#2A2A2E' : '#F9FAFB' }]}>
        {item.image ? (
          <Image source={{ uri: getImageUrl(item.image) || item.image }} style={styles.img} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name="image-off-outline" size={32} color={colors.text + '40'} />
        )}
        {!item.is_approved && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>NPR {item.price}</Text>
        <View style={styles.stockRow}>
          <View style={[styles.stockDot, { backgroundColor: (item.stock_quantity ?? 0) > 5 ? '#4CAF50' : '#FF9800' }]} />
          <Text style={[styles.stockText, { color: colors.text + '70' }]}>
            {item.stock_quantity ?? 0} in stock
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
          onPress={() => router.push({ pathname: '/(vendor)/products/[id]' as any, params: { id: item.id } })}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FF5252' + '15' }]}
          onPress={() => openDeleteModal(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Products</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(vendor)/products/new' as any)}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="package-variant-closed" size={64} color={colors.text + '30'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Products Yet</Text>
          <Text style={[styles.emptyMsg, { color: colors.text + '60' }]}>Start building your store by adding your first product.</Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(vendor)/products/new' as any)}
          >
            <Text style={{ color: '#FFF', fontWeight: '800' }}>Add First Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}

      <ConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product?"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        icon="trash"
        isLoading={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '900' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 20, borderWidth: 1, padding: 12,
  },
  imgWrap: {
    width: 72, height: 72, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  pendingBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,152,0,0.85)', paddingVertical: 2, alignItems: 'center',
  },
  pendingText: { color: '#FFF', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '700' },
  price: { fontSize: 14, fontWeight: '900' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 12, fontWeight: '600' },
  actions: { gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900' },
  emptyMsg: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
});
