import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { myOrders } from '@/services/samagri.service';
import { getImageUrl } from '@/utils/image';

interface ShopOrder {
  id: number | string;
  created_at: string;
  total_amount: number;
  status: string;
  items: any[];
}

export default function ShopOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#F59E0B';
      case 'SHIPPED': return '#3B82F6';
      case 'DELIVERED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#999';
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await myOrders();
        const data = res.data?.results || res.data || [];
        setOrders(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderItem = ({ item }: { item: ShopOrder }) => {
    // Extract preview from first item
    const firstItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const previewImg = firstItem?.samagri_item?.image || '';
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => router.push(`/(customer)/shop/order/${item.id}` as any)}
      >
        <Image
          source={{ uri: getImageUrl(previewImg) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=200' }}
          style={styles.previewImage}
        />
        <View style={styles.orderInfo}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>ORD-{item.id}</Text>
            <Text style={styles.orderDate}>{dateStr}</Text>
          </View>
          <Text style={styles.orderMeta}>{item.items?.length || 0} items • NPR {item.total_amount || 0}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status || 'Pending'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>My Shop Orders</Text>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>You haven&apos;t placed any orders yet</Text>
              <TouchableOpacity 
                style={styles.shopBtn}
                onPress={() => router.push('/(customer)/shop' as any)}
              >
                <Text style={styles.shopBtnText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#3E2723' },
  listContent: { padding: 15 },
  orderCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 15, 
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee'
  },
  previewImage: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  orderInfo: { flex: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#3E2723' },
  orderDate: { fontSize: 12, color: '#999' },
  orderMeta: { fontSize: 14, color: '#666', marginBottom: 8 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16, marginBottom: 20 },
  shopBtn: { 
    backgroundColor: '#f97316', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  shopBtnText: { color: '#fff', fontWeight: 'bold' },
});
