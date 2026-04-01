import React, { useEffect, useState } from 'react'; // Refreshed for routing
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { listBookings } from '@/services/booking.service';
import { Booking } from '@/services/api';
import { useChat } from '@/store/chat.store';

export default function BookingsScreen() {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openChat } = useChat();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED'>('PENDING');

  const tabs = [
    { id: 'PENDING', label: 'Pending' },
    { id: 'ACCEPTED', label: 'Accepted' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const response = await listBookings({ status: selectedTab });
        if (isMounted) {
          setBookings(Array.isArray(response?.data?.results) ? response.data.results : response?.data || []);
        }
      } catch (e) {
        if (isMounted) {
          setError(`Unable to load ${selectedTab.toLowerCase()} bookings`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [selectedTab]);

  const renderItem = ({ item }: { item: Booking }) => {
    const statusColor =
      item.status === 'ACCEPTED'
        ? '#16A34A'
        : item.status === 'COMPLETED'
          ? '#2563EB'
          : item.status === 'CANCELLED'
            ? '#DC2626'
            : '#D97706';

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
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
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
          {item.payment_status && (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={styles.paidText}>Paid</Text>
            </View>
          )}
          {item.status !== 'CANCELLED' && (
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
        {item.status !== 'CANCELLED' && (
          <View style={styles.quickActionRow}>
            {!item.payment_status && (
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#F59E0B' }]}
                onPress={() => router.push(`/(customer)/payments/checkout?bookingId=${item.id}` as any)}
              >
                <Ionicons name="card" size={16} color="#FFF" />
                <Text style={styles.quickActionText}>Pay Now</Text>
              </TouchableOpacity>
            )}

            {(item.status === 'ACCEPTED' || item.status === 'PENDING') && (
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#3B82F6', marginLeft: 8 }]}
                onPress={() => router.push(`/video/${item.id}`)}
              >
                <Ionicons name="videocam" size={16} color="#FFF" />
                <Text style={styles.quickActionText}>Video Puja</Text>
              </TouchableOpacity>
            )}

            {item.status === 'ACCEPTED' && (
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
      <View style={[styles.tabContainer, { backgroundColor: '#FFF' }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setSelectedTab(tab.id as any)}
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

      {loading ? (
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
                No {selectedTab.toLowerCase()} bookings found
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
});

