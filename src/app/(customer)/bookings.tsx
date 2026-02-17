import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { Booking, fetchBookings } from '@/services/api';

export default function BookingsScreen() {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await fetchBookings();
        if (isMounted) {
          setBookings(data);
        }
      } catch (e) {
        if (isMounted) {
          setError('Unable to load bookings');
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
  }, []);

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
        onPress={() => router.push(`/(customer)/booking?id=${item.id}` as any)}
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#E5E7EB' }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Bookings</Text>
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
                size={40}
                color={isDark ? '#4B5563' : '#D1D5DB'}
              />
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: isDark ? '#9CA3AF' : '#6B7280',
                  },
                ]}
              >
                No bookings yet
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
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
});
