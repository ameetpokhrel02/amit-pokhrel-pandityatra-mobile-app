import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { listVendorOrders, VendorOrder } from '@/services/vendor.service';

const STATUS_COLORS: Record<string, string> = {
  PAID: '#4CAF50', PENDING: '#FF9800', SHIPPED: '#2196F3',
  DELIVERED: '#9C27B0', CANCELLED: '#F44336',
};

const FILTERS = ['ALL', 'PAID', 'SHIPPED', 'DELIVERED'];

export default function VendorOrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const load = async () => {
    try {
      const res = await listVendorOrders();
      // Handle various response structures (paginated results, flat list, or nested orders key)
      const data = res.data?.results || res.data?.orders || res.data?.data || res.data;
      
      console.log('[VendorOrders] Loaded data structure:', {
        hasData: !!res.data,
        isResults: !!res.data?.results,
        isOrders: !!res.data?.orders,
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0
      });

      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[VendorOrders] Failed to load orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const renderItem = ({ item }: { item: VendorOrder }) => {
    const statusColor = STATUS_COLORS[item.status] || '#888';
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F0F0F0' }]}
        onPress={() => router.push({ pathname: '/(vendor)/orders/[id]' as any, params: { id: item.id } })}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          <View>
            <Text style={[styles.orderId, { color: colors.text + '60' }]}>Order #{item.id}</Text>
            <Text style={[styles.customerName, { color: colors.text }]}>{item.customer_name}</Text>
            <Text style={[styles.customerEmail, { color: colors.text + '60' }]}>{item.customer_email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '40' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.metaRow}>
            <Ionicons name="cube-outline" size={14} color={colors.text + '60'} />
            <Text style={[styles.metaText, { color: colors.text + '70' }]}>
              {item.items?.length ?? 0} item{(item.items?.length ?? 0) !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.text + '60'} />
            <Text style={[styles.metaText, { color: colors.text + '70' }]}>{item.city}</Text>
          </View>
          <Text style={[styles.amount, { color: colors.primary }]}>NPR {item.total_amount}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Orders</Text>
        <Text style={[styles.count, { color: colors.text + '60' }]}>{orders.length} total</Text>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: colors.card }]}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.text + '60' }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={64} color={colors.text + '30'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Yet</Text>
          <Text style={[styles.emptyMsg, { color: colors.text + '60' }]}>Orders for your products will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '900' },
  count: { fontSize: 14, fontWeight: '600' },
  filterBar: { flexDirection: 'row', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  filterText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  customerName: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  customerEmail: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '600' },
  amount: { marginLeft: 'auto', fontSize: 16, fontWeight: '900' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900' },
  emptyMsg: { fontSize: 14, textAlign: 'center' },
});
