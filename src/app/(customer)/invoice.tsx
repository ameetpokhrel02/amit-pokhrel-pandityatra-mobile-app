import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getBooking } from '@/services/booking.service';
import { useTheme } from '@/store/ThemeContext';
import * as Linking from 'expo-linking';
import { API_BASE_URL } from '@/services/api-client';
import { ScreenshotButton } from '@/components/ui/ScreenshotButton';
import Toast from 'react-native-toast-message';

export default function InvoiceViewerScreen() {
  const router = useRouter();
  const { bookingId, orderId } = useLocalSearchParams<{ bookingId?: string; orderId?: string }>();
  const { colors } = useTheme();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // This ref wraps the invoice card that will be captured
  const invoiceRef = useRef<View>(null);

  useEffect(() => {
    if (bookingId) loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await getBooking(Number(bookingId));
      setBooking(res.data);
    } catch {
      // Silently fail in production
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!bookingId) return;
    try {
      const invoiceUrl = `${API_BASE_URL}bookings/${bookingId}/invoice/`;
      Linking.openURL(invoiceUrl);
    } catch {
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
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Invoice #{booking?.id || orderId || bookingId}
        </Text>
        <TouchableOpacity onPress={handleDownload} accessibilityLabel="Download invoice PDF">
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Invoice Body (captured region) ── */}
      <ScrollView contentContainerStyle={styles.invoiceWrapper}>
        {/* collapsible ref: only the card is captured */}
        <View ref={invoiceRef} collapsable={false} style={styles.invoiceCard}>

          {/* Brand row */}
          <View style={styles.brandRow}>
            <Text style={[styles.brandName, { color: colors.primary }]}>PanditYatra</Text>
            <Text style={[styles.invoiceLabel, { color: colors.textSecondary }]}>INVOICE</Text>
          </View>

          {/* Bill To / Date */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={[styles.infoTitle, { color: colors.placeholder }]}>Bill To:</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {booking?.user_full_name || 'Customer'}
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]} numberOfLines={2}>
                {booking?.customer_location || 'Address not listed'}
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={[styles.infoTitle, { color: colors.placeholder }]}>Date:</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{booking?.booking_date}</Text>
              <Text style={[styles.infoTitle, { color: colors.placeholder }]}>Status:</Text>
              <Text
                style={[
                  styles.infoVal,
                  {
                    color: booking?.payment_status === 'PAID' ? colors.success : colors.danger,
                    fontWeight: 'bold',
                  },
                ]}
              >
                {booking?.payment_status || 'PENDING'}
              </Text>
            </View>
          </View>

          {/* Line items table */}
          <View style={[styles.table, { borderColor: colors.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.tableHead, { flex: 2, textAlign: 'left', color: colors.placeholder }]}>
                Description
              </Text>
              <Text style={[styles.tableHead, { color: colors.placeholder }]}>Qty</Text>
              <Text style={[styles.tableHead, { color: colors.placeholder }]}>Price</Text>
            </View>

            <View style={[styles.tableRow, { borderColor: colors.border }]}>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'left', color: colors.text }]}>
                {booking?.service_name || 'Puja Service'}
              </Text>
              <Text style={[styles.tableCell, { color: colors.text }]}>1</Text>
              <Text style={[styles.tableCell, { color: colors.text }]}>{booking?.service_fee}</Text>
            </View>

            {Number(booking?.samagri_fee) > 0 && (
              <View style={[styles.tableRow, { borderColor: colors.border }]}>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'left', color: colors.text }]}>
                  Puja Samagri (Materials)
                </Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>1</Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>{booking?.samagri_fee}</Text>
              </View>
            )}
          </View>

          {/* Totals */}
          <View style={styles.calculation}>
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.calcVal, { color: colors.text }]}>NPR {booking?.total_fee}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Tax (0%)</Text>
              <Text style={[styles.calcVal, { color: colors.text }]}>0</Text>
            </View>
            <View style={[styles.calcRow, styles.finalTotal, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.primary }]}>Total</Text>
              <Text style={[styles.totalVal, { color: colors.primary }]}>NPR {booking?.total_fee}</Text>
            </View>
          </View>

          {/* Footer note */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Thank you for choosing PanditYatra for your spiritual needs.
            </Text>
            <Text style={[styles.footerSub, { color: colors.placeholder }]}>
              This is a computer-generated invoice.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Action Bar: PDF Download + Screenshot ── */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {/* PDF Download */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.outlineBtn, { borderColor: colors.primary }]}
          onPress={handleDownload}
          accessibilityRole="button"
          accessibilityLabel="Download invoice as PDF"
        >
          <Ionicons name="download-outline" size={18} color={colors.primary} />
          <Text style={[styles.outlineBtnText, { color: colors.primary }]}>PDF</Text>
        </TouchableOpacity>

        {/* Screenshot → PanditYatra album */}
        <View style={styles.screenshotBtnWrap}>
          <ScreenshotButton
            captureRef={invoiceRef}
            label="Save Screenshot"
            loadingLabel="Capturing…"
            successLabel="Saved to Album ✓"
            variant="solid"
            size="md"
            silent={false}
            style={styles.screenshotInner}
            onSuccess={(uri) => {
              console.info('[Invoice] Screenshot saved:', uri);
              Toast.show({
                type: 'success',
                text1: 'Saved to PanditYatra Album',
                text2: 'Invoice screenshot stored in your gallery.',
                visibilityTime: 3000,
              });
            }}
            onError={(err) => {
              Toast.show({
                type: 'error',
                text1: 'Screenshot Failed',
                text2: err,
              });
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  invoiceWrapper: {
    padding: 15,
    paddingBottom: 120,
  },
  invoiceCard: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
    paddingBottom: 12,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '900',
  },
  invoiceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCol: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoVal: {
    fontSize: 14,
    marginBottom: 4,
  },
  table: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
  },
  tableHead: {
    flex: 1,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
  },
  calculation: {
    paddingLeft: '40%',
    marginBottom: 16,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calcLabel: {
    fontSize: 14,
  },
  calcVal: {
    fontWeight: '700',
    fontSize: 14,
  },
  finalTotal: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 20,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  footerSub: {
    fontSize: 10,
  },
  // ── Action Bar ──
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  outlineBtn: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  screenshotBtnWrap: {
    flex: 1,
  },
  screenshotInner: {
    width: '100%',
  },
});
