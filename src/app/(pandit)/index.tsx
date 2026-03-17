import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { fetchProfile } from '@/services/auth.service';
import { PanditService } from '@/services/api';
import { togglePanditAvailability, fetchPanditMyServices } from '@/services/pandit.service';
import { fetchNotifications, markNotificationAsRead, Notification } from '@/services/notification.service';
import { joinVideoRoom } from '@/services/video.service';
import { listBookings } from '@/services/booking.service';
import dayjs from 'dayjs';

export default function PanditDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pending: '0',
    upcoming: '0',
    earnings: '₹0',
    rating: '0.0'
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await fetchProfile();
      const profileData = profileRes.data;
      setProfile(profileData);

      // If user has a pandit profile
      if (profileData.pandit_profile) {
        setIsAvailable(profileData.pandit_profile.is_available);
        setStats({
          pending: profileData.pandit_profile.pending_bookings?.toString() || '0',
          upcoming: profileData.pandit_profile.upcoming_bookings?.toString() || '0',
          earnings: `₹${profileData.pandit_profile.total_earnings || 0}`,
          rating: profileData.pandit_profile.rating ? profileData.pandit_profile.rating.toString() : '0.0'
        });
      }

      const servicesRes = await fetchPanditMyServices();
      setMyServices(servicesRes.data);

      const notificationsData = await fetchNotifications();
      setNotifications(notificationsData);

      const bookingsRes = await listBookings({ status: 'ACCEPTED', limit: 3 });
      setRecentBookings(bookingsRes.data.results || bookingsRes.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAvailability = async (value: boolean) => {
    try {
      setIsAvailable(value);
      await togglePanditAvailability(value);
    } catch (error) {
      console.error('Error toggling availability:', error);
      setIsAvailable(!value); // Revert on error
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleJoinVideo = async (bookingId: number) => {
    try {
      const response = await joinVideoRoom(bookingId);
      if (response.room_url) {
        // Navigation or opening URL logic here
        console.log('Joining room:', response.room_url);
      }
    } catch (error) {
      console.error('Error joining video room:', error);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#FF6F00', paddingBottom: 30, marginBottom: 0 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: '#FFF' }]}>Namaste, {profile?.full_name?.split(' ')[0] || 'Pandit Ji'}!</Text>
          <View style={styles.headerRow}>
            <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, borderRadius: 20 }]}>
              <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
              <Text style={[styles.verifiedText, { color: '#FFF' }]}>Verified</Text>
            </View>
            <View style={styles.availabilityToggle}>
              <Text style={[styles.availabilityText, { color: isAvailable ? '#FFF' : 'rgba(255,255,255,0.7)' }]}>
                {isAvailable ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#FFD700' }}
                thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(pandit)/profile')}>
          <Ionicons name="person-circle-outline" size={50} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard label="Pending" value={stats.pending} icon="time-outline" color="#FF6F00" />
        <StatCard label="Upcoming" value={stats.upcoming} icon="calendar-outline" color="#3B82F6" />
        <TouchableOpacity style={{ width: '23%' }} onPress={() => router.push('/(pandit)/earnings')}>
          <StatCard label="Earnings" value={stats.earnings} icon="wallet-outline" color="#16A34A" />
        </TouchableOpacity>
        <StatCard label="Reviews" value={stats.rating} icon="star-outline" color="#FFD700" />
      </View>

      {/* Upcoming Pujas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Pujas</Text>
          <TouchableOpacity onPress={() => router.push('/(pandit)/bookings')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <UpcomingPujaCard
                key={booking.id}
                customerName={booking.user_full_name || 'Customer'}
                pujaType={booking.service_name || 'Puja'}
                date={dayjs(booking.booking_date).format('DD MMM, hh:mm A')}
                status={booking.status}
                onPress={() => router.push({ pathname: '/(pandit)/bookings', params: { id: booking.id } } as any)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming bookings found.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Booking Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionButton label="Accept/Decline" icon="checkmark-done-circle-outline" onPress={() => router.push('/(pandit)/bookings')} />
          <ActionButton label="Message" icon="chatbubble-ellipses-outline" onPress={() => router.push('/chat/rooms')} />
          <ActionButton label="Withdraw Funds" icon="wallet-outline" onPress={() => router.push('/(pandit)/earnings')} />
          <ActionButton label="Update Calendar" icon="calendar-outline" onPress={() => router.push('/(pandit)/calendar')} />
        </View>
      </View>

      {/* Services Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Services</Text>
          <TouchableOpacity onPress={() => router.push('/(pandit)/services' as any)}>
            <Text style={styles.seeAll}>Manage</Text>
          </TouchableOpacity>
        </View>
        {myServices.length > 0 ? (
          myServices.map((service, index) => (
            <View key={service.id || index} style={[styles.serviceCard, { marginBottom: 8 }]}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.puja_details?.name}</Text>
                <Text style={styles.serviceDetails}>{service.duration_minutes} Mins • ₹{service.custom_price}</Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No services added yet.</Text>
          </View>
        )}
      </View>

      {/* Notifications / Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/notifications' as any)}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {notifications.length > 0 ? (
          notifications.slice(0, 3).map((notif) => (
            <View key={notif.id} style={[styles.alertCard, { marginBottom: 8 }]}>
              <View style={styles.alertIcon}>
                <Ionicons name="notifications" size={20} color={notif.is_read ? "#9CA3AF" : "#EF4444"} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{notif.title}</Text>
                <Text style={styles.alertMessage}>{notif.message}</Text>
              </View>
              <TouchableOpacity style={styles.alertAction} onPress={() => handleMarkAsRead(notif.id)}>
                <Text style={styles.alertActionText}>Read</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No new notifications.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function UpcomingPujaCard({ customerName, pujaType, date, status, onPress }: { 
  customerName: string, 
  pujaType: string, 
  date: string, 
  status: string,
  onPress?: () => void
}) {
  return (
    <TouchableOpacity style={styles.upcomingCard} onPress={onPress}>
      <View style={styles.upcomingContent}>
        <Text style={styles.upcomingTitle}>{pujaType}</Text>
        <Text style={styles.upcomingCustomer}>for {customerName}</Text>
        <Text style={styles.upcomingDate}><Ionicons name="time-outline" size={12} /> {date}</Text>
      </View>
      <View style={styles.upcomingActions}>
        <View style={[styles.statusBadge, { backgroundColor: status === 'Confirmed' ? '#DCFCE7' : '#FEF3C7' }]}>
          <Text style={[styles.statusText, { color: status === 'Confirmed' ? '#166534' : '#92400E' }]}>{status}</Text>
        </View>
        <TouchableOpacity style={styles.viewButton} onPress={onPress}>
          <Text style={styles.viewButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ActionButton({ label, icon, onPress }: { label: string, icon: any, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.actionButtonIcon}>
        <Ionicons name={icon} size={24} color={Colors.light.primary} />
      </View>
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    // fontFamily: 'Playfair Display', // Ensure fonts are loaded or use defaults
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    width: '23%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    // fontFamily: 'Playfair Display',
  },
  seeAll: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  verticalList: {
    gap: 12,
  },
  upcomingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  upcomingCustomer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  upcomingDate: {
    fontSize: 12,
    color: '#999',
  },
  upcomingActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionButton: {
    width: '47%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 14,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    color: '#666',
  },
  alertAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  alertActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
