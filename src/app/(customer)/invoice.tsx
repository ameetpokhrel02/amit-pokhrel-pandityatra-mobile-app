import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getBooking } from '@/services/booking.service';
import { useTheme } from '@/store/ThemeContext';
import * as Linking from 'expo-linking';
import { API_BASE_URL } from '@/services/api-client';

export default function InvoiceViewerScreen() {
  const router = useRouter();
  const { bookingId, orderId } = useLocalSearchParams<{ bookingId?: string, orderId?: string }>();
  const { colors } = useTheme();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await getBooking(Number(bookingId));
      setBooking(res.data);
    } catch (e) {
      // Silently fail for production
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!bookingId) return;
    try {
      const invoiceUrl = `${API_BASE_URL}bookings/${bookingId}/invoice/`;
      Linking.openURL(invoiceUrl);
    } catch (error) {
      // Silently fail
    }
  };

  if (loading && !booking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#3E2723" />
        </TouchableOpacity>
        <Text style={styles.title}>Invoice #{booking?.id || orderId || bookingId}</Text>
        <TouchableOpacity onPress={handleDownload}>
          <Ionicons name="share-outline" size={24} color="#f97316" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.invoiceWrapper}>
        <View style={styles.invoiceCard}>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>PanditYatra</Text>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoTitle}>Bill To:</Text>
              <Text style={styles.infoVal}>{booking?.user_full_name || 'Customer'}</Text>
              <Text style={styles.infoVal} numberOfLines={2}>{booking?.customer_location || 'Address not listed'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoTitle}>Date:</Text>
              <Text style={styles.infoVal}>{booking?.booking_date}</Text>
              <Text style={styles.infoTitle}>Status:</Text>
              <Text style={[styles.infoVal, { color: booking?.payment_status === 'PAID' ? '#10B981' : '#EF4444', fontWeight: 'bold' }]}>
                {booking?.payment_status || 'PENDING'}
              </Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHead, { flex: 2, textAlign: 'left' }]}>Description</Text>
              <Text style={styles.tableHead}>Qty</Text>
              <Text style={styles.tableHead}>Price</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'left' }]}>{booking?.service_name || 'Puja Service'}</Text>
              <Text style={styles.tableCell}>1</Text>
              <Text style={styles.tableCell}>{booking?.service_fee}</Text>
            </View>
            
            {(Number(booking?.samagri_fee) > 0) && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'left' }]}>Puja Samagri (Materials)</Text>
                <Text style={styles.tableCell}>1</Text>
                <Text style={styles.tableCell}>{booking?.samagri_fee}</Text>
              </View>
            )}
          </View>

          <View style={styles.calculation}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcVal}>NPR {booking?.total_fee}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Tax (0%)</Text>
              <Text style={styles.calcVal}>0</Text>
            </View>
            <View style={[styles.calcRow, styles.finalTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>NPR {booking?.total_fee}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for choosing PanditYatra for your spiritual needs.</Text>
            <Text style={styles.footerSub}>This is a computer-generated invoice.</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.downloadFab} onPress={handleDownload}>
        <Ionicons name="download" size={24} color="#fff" />
        <Text style={styles.fabText}>Save PDF</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#3E2723' },
  backButton: { padding: 5 },
  invoiceWrapper: { padding: 15, paddingBottom: 100 },
  invoiceCard: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#f97316', paddingBottom: 10 },
  brandName: { fontSize: 24, fontWeight: 'bold', color: '#f97316' },
  invoiceLabel: { fontSize: 16, fontWeight: 'bold', color: '#666', letterSpacing: 2 },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  infoCol: { flex: 1 },
  infoTitle: { fontSize: 12, fontWeight: 'bold', color: '#999', marginBottom: 5, textTransform: 'uppercase' },
  infoVal: { fontSize: 14, color: '#3E2723', marginBottom: 3 },
  table: { marginBottom: 30 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9f9f9', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableHead: { flex: 1, fontWeight: 'bold', color: '#666', textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableCell: { flex: 1, color: '#3E2723', textAlign: 'center', fontSize: 13 },
  calculation: { paddingLeft: '40%' },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calcLabel: { color: '#666' },
  calcVal: { fontWeight: 'bold', color: '#3E2723' },
  finalTotal: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#f97316' },
  totalVal: { fontSize: 18, fontWeight: 'bold', color: '#f97316' },
  footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 },
  footerText: { textAlign: 'center', fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 5 },
  footerSub: { fontSize: 10, color: '#999' },
  downloadFab: { 
    position: 'absolute', 
    bottom: 30, 
    left: 20, 
    right: 20, 
    backgroundColor: '#f97316', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  fabText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});
