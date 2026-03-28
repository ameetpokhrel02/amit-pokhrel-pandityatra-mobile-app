import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { getVendorOrder, updateOrderStatus, VendorOrder } from '@/services/vendor.service';

const STATUS_COLORS: Record<string, string> = {
  PAID: '#4CAF50', PENDING: '#FF9800', SHIPPED: '#2196F3',
  DELIVERED: '#9C27B0', CANCELLED: '#F44336',
};

export default function VendorOrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getVendorOrder(Number(id));
        setOrder(res.data);
      } catch {
        Alert.alert('Error', 'Could not load order.');
        router.back();
      } finally { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  const handleStatus = (newStatus: 'SHIPPED' | 'DELIVERED') => {
    Alert.alert('Update Status', `Mark this order as ${newStatus}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setUpdating(true);
            await updateOrderStatus(Number(id), newStatus);
            setOrder(prev => prev ? { ...prev, status: newStatus } : prev);
          } catch {
            Alert.alert('Error', 'Failed to update status.');
          } finally { setUpdating(false); }
        }
      }
    ]);
  };

  if (loading || !order) return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  const statusColor = STATUS_COLORS[order.status] || '#888';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Order #{order.id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}>
        {/* Status */}
        <View style={[styles.statusCard, { backgroundColor: statusColor + '15', borderColor: statusColor + '40' }]}>
          <Text style={[styles.statusLabel, { color: statusColor }]}>Status: {order.status}</Text>
          <Text style={[styles.dateText, { color: colors.text + '60' }]}>
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>

        {/* Customer */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Details</Text>
          <DetailRow icon="person-outline" label="Name" value={order.customer_name} colors={colors} />
          <DetailRow icon="mail-outline" label="Email" value={order.customer_email} colors={colors} />
          <DetailRow icon="call-outline" label="Phone" value={order.phone_number} colors={colors} />
          <DetailRow icon="location-outline" label="Address" value={`${order.shipping_address}, ${order.city}`} colors={colors} />
        </View>

        {/* Items */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Items</Text>
          {order.items?.map(item => (
            <View key={item.id} style={[styles.itemRow, { borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.item_name}</Text>
              <Text style={[styles.itemQty, { color: colors.text + '70' }]}>× {item.quantity}</Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>NPR {parseFloat(item.price_at_purchase).toFixed(0)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>NPR {order.total_amount}</Text>
          </View>
        </View>

        {/* Actions */}
        {(order.status === 'PAID') && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#2196F3' }, updating && { opacity: 0.7 }]}
            onPress={() => handleStatus('SHIPPED')} disabled={updating}
          >
            {updating ? <ActivityIndicator color="#FFF" /> : (
              <><Ionicons name="airplane-outline" size={18} color="#FFF" /><Text style={styles.actionBtnText}>Mark as Shipped</Text></>
            )}
          </TouchableOpacity>
        )}
        {(order.status === 'SHIPPED') && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#9C27B0' }, updating && { opacity: 0.7 }]}
            onPress={() => handleStatus('DELIVERED')} disabled={updating}
          >
            {updating ? <ActivityIndicator color="#FFF" /> : (
              <><Ionicons name="checkmark-circle-outline" size={18} color="#FFF" /><Text style={styles.actionBtnText}>Mark as Delivered</Text></>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, colors }: any) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={colors.primary} style={{ width: 20 }} />
      <Text style={[styles.detailLabel, { color: colors.text + '60' }]}>{label}:</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 16, gap: 16 },
  statusCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: 16, fontWeight: '900' },
  dateText: { fontSize: 12, fontWeight: '600' },
  section: { borderRadius: 20, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 13, width: 60 },
  detailValue: { fontSize: 13, fontWeight: '600', flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  itemName: { flex: 1, fontSize: 14, fontWeight: '600' },
  itemQty: { fontSize: 13, marginRight: 12 },
  itemPrice: { fontSize: 14, fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalAmount: { fontSize: 20, fontWeight: '900' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
