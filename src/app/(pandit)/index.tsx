import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { fetchProfile } from '@/services/auth.service';
import { PanditService } from '@/services/api';
import { togglePanditAvailability, fetchPanditMyServices } from '@/services/pandit.service';

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileData = await fetchProfile();
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

      const servicesData = await fetchPanditMyServices();
      setMyServices(servicesData);

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
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Namaste, {profile?.full_name?.split(' ')[0] || 'Pandit Ji'}!</Text>
          <View style={styles.headerRow}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
            <View style={styles.availabilityToggle}>
              <Text style={[styles.availabilityText, { color: isAvailable ? '#10B981' : '#666' }]}>
                {isAvailable ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(pandit)/profile')}>
          <Ionicons name="person-circle-outline" size={50} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard label="Pending" value={stats.pending} icon="time-outline" color="#F59E0B" />
        <StatCard label="Upcoming" value={stats.upcoming} icon="calendar-outline" color="#3B82F6" />
        <StatCard label="Earnings" value={stats.earnings} icon="wallet-outline" color="#10B981" />
        <StatCard label="Reviews" value={stats.rating} icon="star-outline" color="#FBBF24" />
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
          <UpcomingPujaCard
            customerName="Anita Sharma"
            pujaType="Satyanarayan Puja"
            date="15 Jan, 10:00 AM"
            status="Confirmed"
          />
        </View>
      </View>

      {/* Booking Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionButton label="Accept/Decline" icon="checkmark-done-circle-outline" onPress={() => router.push('/(pandit)/bookings')} />
          <ActionButton label="Message" icon="chatbubble-ellipses-outline" onPress={() => { }} />
          <ActionButton label="Join Video Puja" icon="videocam-outline" onPress={() => { }} />
          <ActionButton label="Update Calendar" icon="calendar-outline" onPress={() => router.push('/(pandit)/calendar')} />
        </View>
      </View>

      {/* Services Management */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Services</Text>
          <TouchableOpacity onPress={() => { }}>
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
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.alertCard}>
          <View style={styles.alertIcon}>
            <Ionicons name="notifications" size={20} color="#EF4444" />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>New Booking Request</Text>
            <Text style={styles.alertMessage}>Anita Sharma requested Satyanarayan Puja.</Text>
          </View>
          <TouchableOpacity style={styles.alertAction}>
            <Text style={styles.alertActionText}>View</Text>
          </TouchableOpacity>
        </View>
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

function UpcomingPujaCard({ customerName, pujaType, date, status }: { customerName: string, pujaType: string, date: string, status: string }) {
  return (
    <View style={styles.upcomingCard}>
      <View style={styles.upcomingContent}>
        <Text style={styles.upcomingTitle}>{pujaType}</Text>
        <Text style={styles.upcomingCustomer}>for {customerName}</Text>
        <Text style={styles.upcomingDate}><Ionicons name="time-outline" size={12} /> {date}</Text>
      </View>
      <View style={styles.upcomingActions}>
        <View style={[styles.statusBadge, { backgroundColor: status === 'Confirmed' ? '#DCFCE7' : '#FEF3C7' }]}>
          <Text style={[styles.statusText, { color: status === 'Confirmed' ? '#166534' : '#92400E' }]}>{status}</Text>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
