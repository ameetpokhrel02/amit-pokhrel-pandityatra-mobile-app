import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { orderDetail, fetchOrderInvoice } from '@/services/samagri.service';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const res = await orderDetail(Number(id));
        setOrder(res.data);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#666' }}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
      </View>

      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          <Text style={styles.orderIdText}>Order {order.id}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{order.status || 'Pending'}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>Placed on {order.created_at || order.date || ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {(order.items || order.order_items || []).map((item: any) => (
          <View key={String(item.id)} style={styles.itemRow}>
            <Image source={{ uri: item.image || item.item?.image || '' }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name || item.item?.name}</Text>
              <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
              <Text style={styles.itemPrice}>NPR {item.price || item.unit_price || 0}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <Text style={styles.addressText}>{order.address || order.shipping_address || '—'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <View style={styles.paymentRow}>
          <Ionicons name="card-outline" size={20} color="#666" />
          <Text style={styles.paymentText}>{order.payment_method || '—'}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>NPR {order.subtotal || order.summary?.subtotal || 0}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>NPR {order.delivery_fee || order.summary?.delivery || 0}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>NPR {order.total || order.summary?.total || 0}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.invoiceBtn}
        onPress={async () => {
          try {
            await fetchOrderInvoice(Number(id));
            // In a real browser this would download, in RN we might need sharing/saving logic
            // For now, alerting success of fetch
            Alert.alert("Success", "Invoice document fetched. Ready for download.");
          } catch (e) {
            Alert.alert("Error", "Failed to fetch invoice.");
          }
        }}
      >
        <Ionicons name="download-outline" size={20} color="#fff" />
        <Text style={styles.invoiceBtnText}>Download Invoice</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  content: { padding: 20 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20, 
    marginTop: 40 
  },
  backButton: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
  statusSection: { marginBottom: 25 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  orderIdText: { fontSize: 18, fontWeight: 'bold', color: '#3E2723' },
  statusBadge: { backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  dateText: { fontSize: 14, color: '#999' },
  section: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#3E2723', marginBottom: 12 },
  itemRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'center' },
  itemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#3E2723' },
  itemMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#f97316', marginTop: 2 },
  addressText: { fontSize: 14, color: '#666', lineHeight: 20 },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentText: { fontSize: 14, color: '#666', marginLeft: 10 },
  summaryCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#3E2723' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#3E2723' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#f97316' },
  invoiceBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#3E2723', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30
  },
  invoiceBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
