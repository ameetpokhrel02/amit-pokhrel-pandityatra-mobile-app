import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/store/ThemeContext';
import { listBookings } from '@/services/booking.service';
import { Booking } from '@/services/api';
import { useChat } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';

export default function BookingsScreen() {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openChat } = useChat();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'accepted' | 'completed' | 'cancelled'>('pending');
  const requestSeq = useRef(0);

  const tabs = [
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const normalizeStatus = (status: unknown): 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'MISSED' | 'UNKNOWN' => {
    const value = String(status || '').trim().toLowerCase();

    if (['pending', 'awaiting', 'requested'].includes(value)) return 'PENDING';
    if (['accepted', 'confirmed', 'approved'].includes(value)) return 'ACCEPTED';
    if (['completed', 'done', 'finished'].includes(value)) return 'COMPLETED';
    if (['cancelled', 'canceled', 'rejected'].includes(value)) return 'CANCELLED';
    if (['missed', 'no_show', 'no-show'].includes(value)) return 'MISSED';

    return 'UNKNOWN';
  };

  const statusMatchesTab = (status: ReturnType<typeof normalizeStatus>, tab: typeof selectedTab) => {
    if (tab === 'pending') return status === 'PENDING';
    if (tab === 'accepted') return status === 'ACCEPTED';
    if (tab === 'completed') return status === 'COMPLETED';
    return status === 'CANCELLED';
  };

  const extractBookings = (response: any): Booking[] => {
    const payload = response?.data ?? response;

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;

    return [];
  };

  const isPaidBooking = (paymentStatus: unknown) => {
    if (paymentStatus === true) return true;
    const normalized = String(paymentStatus || '').trim().toUpperCase();
    return ['PAID', 'SUCCESS', 'COMPLETED'].includes(normalized);
  };

  const loadBookings = useCallback(
    async (tab: typeof selectedTab, showFullLoader: boolean) => {
      const reqId = ++requestSeq.current;
      setError(null);

      if (showFullLoader) {
        setLoading(true);
      } else {
        setTabLoading(true);
      }

      try {
        // Use API filter if backend supports it, then enforce client-side status filtering as fallback.
        const response = await listBookings({ status: tab });
        if (reqId !== requestSeq.current) return;

        const allBookings = extractBookings(response);
        const filtered = allBookings.filter((booking) => statusMatchesTab(normalizeStatus(booking.status), tab));
        setBookings(filtered);
      } catch (e) {
        if (reqId !== requestSeq.current) return;
        setBookings([]);
        setError(`Unable to load ${tab} bookings`);
      } finally {
        if (reqId !== requestSeq.current) return;

        if (showFullLoader) {
          setLoading(false);
        }
        setTabLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isAuthLoading) return;
    
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    loadBookings(selectedTab, true);
  }, [selectedTab, isAuthenticated, isAuthLoading, loadBookings]);

  // Refetch when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated || isAuthLoading) return;

      loadBookings(selectedTab, false);
    }, [selectedTab, isAuthenticated, isAuthLoading, loadBookings])
  );

  const renderItem = ({ item }: { item: Booking }) => {
    const normalizedStatus = normalizeStatus(item.status);
    const statusLabel =
      normalizedStatus === 'UNKNOWN'
        ? String(item.status || 'Unknown')
        : normalizedStatus.charAt(0) + normalizedStatus.slice(1).toLowerCase();

    const statusColor =
      normalizedStatus === 'ACCEPTED'
        ? '#16A34A'
        : normalizedStatus === 'COMPLETED'
          ? '#2563EB'
          : normalizedStatus === 'CANCELLED'
            ? '#DC2626'
            : '#D97706';

    const isPaid = isPaidBooking(item.payment_status);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}
        onPress={() => router.push(`/(customer)/bookings/${item.id}` as any)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.serviceName, { color: colors.text }]}>
            {item.service_name || 'Puja Booking'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={[styles.detailText, { color: isDark ? '#AAA' : '#666' }]}>
          {item.booking_date}
          {item.booking_time ? ` • ${item.booking_time}` : ''}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            <Ionicons name="person-outline" size={14} color={isDark ? '#AAA' : '#666'} />
            <Text style={[styles.footerText, { color: isDark ? '#AAA' : '#666' }]}>
              {item.pandit_name || item.pandit_full_name || 'Assigned Pandit'}
            </Text>
          </View>
          {isPaid && (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={styles.paidText}>Paid</Text>
            </View>
          )}
          {normalizedStatus !== 'CANCELLED' && (
            <TouchableOpacity
              style={[styles.chatIconButton, { backgroundColor: colors.primary + '15' }]}
              onPress={() => openChat(item.id, item.pandit_name || item.pandit_full_name)}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
              <Text style={[styles.chatIconText, { color: colors.primary }]}>Chat</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Action Buttons for Payment and Video Call */}
        {normalizedStatus !== 'CANCELLED' && (
          <View style={styles.quickActionRow}>
            {!isPaid && (
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#F59E0B' }]}
                onPress={() => router.push(`/(customer)/payments/checkout?bookingId=${item.id}` as any)}
              >
                <Ionicons name="card" size={16} color="#FFF" />
                <Text style={styles.quickActionText}>Pay Now</Text>
              </TouchableOpacity>
            )}

            {normalizedStatus === 'ACCEPTED' && item.service_location === 'ONLINE' && (
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#FF6F00', marginLeft: 8 }]}
                onPress={() => router.push({
                   pathname: '/video',
                   params: {
                     bookingId: item.id,
                     role: 'customer',
                     peerName: item.pandit_name || item.pandit_full_name,
                     serviceName: item.service_name
                   }
                } as any)}
              >
                <Ionicons name="videocam" size={16} color="#FFF" />
                <Text style={styles.quickActionText}>Join Session</Text>
              </TouchableOpacity>
            )}

            {isPaid && (
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#3B82F6', marginLeft: 8 }]}
                onPress={() => router.push(`/(customer)/invoice?bookingId=${item.id}` as any)}
              >
                <Ionicons name="receipt-outline" size={16} color="#FFF" />
                <Text style={styles.quickActionText}>Invoice</Text>
              </TouchableOpacity>
            )}

            {normalizedStatus === 'ACCEPTED' && (
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: colors.primary, marginLeft: 8 }]}
                onPress={() => router.push(`/(customer)/bookings/samagri-recommendations?bookingId=${item.id}` as any)}
              >
                <Ionicons name="sparkles" size={16} color="#FFF" />
                <Text style={styles.quickActionText}>Samagri</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border + '20', borderBottomWidth: 1 }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}> 
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setSelectedTab(tab.id)}
            style={[
              styles.tab,
              selectedTab === tab.id && { borderBottomColor: '#FF6F00', borderBottomWidth: 3 }
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: selectedTab === tab.id ? '#FF6F00' : '#666' },
                selectedTab === tab.id && { fontWeight: '700' }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tabLoading && !loading ? (
        <View style={[styles.tabLoadingWrap, { backgroundColor: colors.background }]}> 
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.tabLoadingText, { color: colors.text + 'A6' }]}>Refreshing {selectedTab} bookings...</Text>
        </View>
      ) : null}

      {!isAuthenticated ? (
        <View style={styles.guestContainer}>
          <View style={[styles.guestCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
            <View style={styles.guestIconWrap}>
              <Ionicons name="lock-closed" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.guestTitle, { color: colors.text }]}>Sign in to view bookings</Text>
            <Text style={[styles.guestSubtitle, { color: colors.text + '80' }]}>
              You need to be logged in to manage your ritual schedules, track pandit arrivals, and join video calls.
            </Text>
            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(public)/role-selection')}
            >
              <Text style={styles.loginBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: isDark ? '#FCA5A5' : '#B91C1C' }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={bookings.length === 0 ? styles.emptyContent : styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="calendar-outline"
                size={60}
                color={isDark ? '#4B5563' : '#D1D5DB'}
              />
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    marginTop: 16,
                  },
                ]}
              >
                No {selectedTab} bookings found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  tabLoadingText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailText: {
    fontSize: 14,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  paidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  chatIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  chatIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  quickActionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  quickActionText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  guestCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  guestIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6F0015',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

