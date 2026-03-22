import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { Booking } from '@/services/api';
import { getBooking, updateBookingStatus, cancelBooking, getBookingInvoice } from '@/services/booking.service';
import { Button } from '@/components/ui/Button';
import dayjs from 'dayjs';
import { usePujaRealtime } from '@/hooks/usePujaRealtime';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      load();
    }
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const response = await getBooking(Number(id));
      setBooking(response.data);
    } catch (error) {
      console.error('Error loading booking:', error);
      Alert.alert('Error', 'Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  const { isConnected } = usePujaRealtime(Number(id), (data) => {
    if (data.type === 'booking_update' || data.status) {
       // Refresh data when an update is received
       load();
    }
  });

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await cancelBooking(Number(id));
              Alert.alert('Success', 'Booking cancelled successfully');
              load();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Booking not found.</Text>
      </View>
    );
  }

  const getStatusColor = () => {
    switch (booking.status) {
      case 'ACCEPTED': return '#16A34A';
      case 'COMPLETED': return '#2563EB';
      case 'CANCELLED': return '#DC2626';
      default: return '#D97706';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Booking Details</Text>
        <View style={styles.wsIndicator}>
           <View style={[styles.wsDot, { backgroundColor: isConnected ? '#16A34A' : '#9CA3AF' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Section */}
        <View style={[styles.statusSection, { backgroundColor: colors.card }]}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{booking.status}</Text>
          </View>
          <Text style={[styles.bookingId, { color: isDark ? '#AAA' : '#666' }]}>
            Booking ID: #{booking.id}
          </Text>
        </View>

        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Service Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{booking.service_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={isDark ? '#AAA' : '#666'} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{booking.pandit_full_name || 'Assigned Pandit'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={isDark ? '#AAA' : '#666'} />
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {dayjs(booking.booking_date).format('dddd, MMMM D, YYYY')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={isDark ? '#AAA' : '#666'} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{booking.booking_time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={isDark ? '#AAA' : '#666'} />
            <Text style={[styles.infoValue, { color: colors.text }]}>{booking.location}</Text>
          </View>
        </View>

        {/* Payment Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: isDark ? '#AAA' : '#666' }]}>Service Fee</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>NPR {booking.total_fee}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#EEE' }]} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>NPR {booking.total_fee}</Text>
          </View>
          <View style={styles.paymentStatusContainer}>
             {booking.payment_status ? (
               <View style={styles.paidBadge}>
                 <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                 <Text style={styles.paidText}>Paid</Text>
               </View>
             ) : (
               <View style={styles.unpaidBadge}>
                 <Ionicons name="alert-circle" size={16} color="#D97706" />
                 <Text style={styles.unpaidText}>Payment Pending</Text>
               </View>
             )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {booking.status === 'ACCEPTED' && (
            <Button 
               title="Join Live Session" 
               onPress={() => router.push(`/video/${booking.id}`)}
               variant="primary"
               leftIcon={<Ionicons name="videocam" size={20} color="white" />}
               style={styles.actionButton}
            />
          )}

          {!booking.payment_status && booking.status !== 'CANCELLED' && (
            <Button 
               title="Pay Now" 
               onPress={() => router.push(`/(customer)/payments/checkout?bookingId=${booking.id}`)}
               style={styles.actionButton}
            />
          )}

          {booking.status === 'COMPLETED' && (
            <Button 
               title="Write a Review" 
               onPress={() => router.push({ pathname: "/(customer)/bookings/review", params: { bookingId: booking.id } })}
               variant="outline"
               style={styles.actionButton}
            />
          )}

          {(booking.status === 'PENDING' || booking.status === 'ACCEPTED') && !cancelling && (
            <TouchableOpacity 
               style={[styles.cancelButton, { borderColor: colors.notification || '#DC2626' }]} 
               onPress={handleCancel}
            >
              <Text style={[styles.cancelButtonText, { color: colors.notification || '#DC2626' }]}>Cancel Booking</Text>
            </TouchableOpacity>
          )}

          {booking.status === 'COMPLETED' && (
            <TouchableOpacity 
               style={[styles.invoiceButton, { borderColor: colors.primary }]} 
               onPress={async () => {
                 try {
                   await import('@/services/booking.service').then(m => m.getBookingInvoice(booking.id));
                   Alert.alert("Success", "Invoice fetched successfully.");
                 } catch (e) {
                   Alert.alert("Error", "Failed to fetch invoice.");
                 }
               }}
            >
               <Ionicons name="download-outline" size={20} color={colors.primary} />
               <Text style={[styles.invoiceButtonText, { color: colors.primary }]}>Download Invoice</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  statusSection: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  bookingId: { fontSize: 13 },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  infoValue: { fontSize: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  paymentStatusContainer: { marginTop: 16, alignItems: 'flex-end' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  paidText: { color: '#166534', fontWeight: 'bold', fontSize: 12 },
  unpaidBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  unpaidText: { color: '#92400E', fontWeight: 'bold', fontSize: 12 },
  actionsContainer: { marginTop: 20, gap: 12 },
  actionButton: { width: '100%' },
  cancelButton: { 
    width: '100%', 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: { fontWeight: 'bold', fontSize: 16 },
  invoiceButton: { 
    width: '100%', 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  },
  invoiceButtonText: { fontWeight: 'bold', fontSize: 16 },
  wsIndicator: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  wsDot: { width: 8, height: 8, borderRadius: 4 },
});
