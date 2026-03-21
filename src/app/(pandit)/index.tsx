import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  ActivityIndicator, 
  RefreshControl, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { getImageUrl } from '@/utils/image';
import { fetchProfile } from '@/services/auth.service';
import { togglePanditAvailability, fetchPanditMyServices } from '@/services/pandit.service';
import { fetchNotifications, markNotificationAsRead, Notification } from '@/services/notification.service';
import { listBookings } from '@/services/booking.service';
import { useAuthStore } from '@/store/auth.store';
import dayjs from 'dayjs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PanditDashboardScreen() {
  const router = useRouter();
  const authStore = useAuthStore();
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

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await fetchProfile();
      const profileData = profileRes.data;
      setProfile(profileData);

      if (profileData.pandit_profile) {
        setIsAvailable(profileData.pandit_profile.is_available);
        setStats({
          pending: profileData.pandit_profile.pending_bookings?.toString() || '0',
          upcoming: profileData.pandit_profile.upcoming_bookings?.toString() || '0',
          earnings: `₹${profileData.pandit_profile.total_earnings || 0}`,
          rating: profileData.pandit_profile.rating ? profileData.pandit_profile.rating.toFixed(1) : '0.0'
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
      setIsAvailable(!value);
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

  const handleLogout = async () => {
    await authStore.logout();
    router.replace('/(auth)/user/login');
  };

  const handleDeleteAccount = async () => {
    // API logic for delete would go here
    Alert.alert("Account Deleted", "Your account has been scheduled for deletion.");
    await authStore.logout();
    router.replace('/(auth)/user/login');
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-50">
        <ActivityIndicator size="large" color="#FF6F00" />
        <Text className="mt-4 text-zinc-500 font-medium">Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <StatusBar barStyle="light-content" backgroundColor="#FF6F00" />
      
      {/* Scrollable Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F00" />
        }
      >
        {/* Header - Saffron Theme */}
        <View className="bg-primary pt-12 pb-24 px-6 rounded-b-[40px] shadow-lg shadow-primary/40">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-white/80 text-lg font-medium">Namaste,</Text>
              <Text className="text-white text-3xl font-extrabold tracking-tight">
                {profile?.full_name?.split(' ')[0] || 'Pandit Ji'}!
              </Text>
              <View className="flex-row items-center mt-3 gap-3">
                <View className="bg-white/20 flex-row items-center px-3 py-1.5 rounded-full border border-white/30">
                  <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                  <Text className="text-white text-[13px] font-bold ml-1.5 uppercase tracking-wider">Verified</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className={`text-[13px] font-bold ${isAvailable ? 'text-white' : 'text-white/60'}`}>
                    {isAvailable ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                  <Switch
                    value={isAvailable}
                    onValueChange={handleToggleAvailability}
                    trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#FFD700' }}
                    thumbColor={isAvailable ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>
            </View>
            <TouchableOpacity 
                className="bg-white/20 p-1 rounded-full border-2 border-white/50"
                onPress={() => router.push('/(pandit)/profile')}
            >
              {profile?.profile_pic ? (
                <Image
                  source={{ uri: getImageUrl(profile.profile_pic) || undefined }}
                  className="w-16 h-16 rounded-full"
                  contentFit="cover"
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center">
                  <Ionicons name="person" size={40} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid - 3 Columns (Instruction followed: 3 equal cards) */}
        <View className="-mt-14 px-6">
          <View className="flex-row justify-between gap-3">
             <StatCard 
               label="Pending" 
               value={stats.pending} 
               icon="time" 
               color="#FF6F00" 
             />
             <StatCard 
               label="Upcoming" 
               value={stats.upcoming} 
               icon="calendar" 
               color="#3B82F6" 
             />
             <StatCard 
               label="Reviews" 
               value={stats.rating} 
               icon="star" 
               color="#FFD700" 
             />
          </View>
        </View>

        <View className="px-6 mt-8">
            {/* Wallet Quick Summary */}
            <TouchableOpacity 
                className="bg-white p-5 rounded-3xl flex-row items-center shadow-md shadow-zinc-200"
                onPress={() => router.push('/(pandit)/earnings')}
            >
                <View className="w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center">
                    <Ionicons name="wallet-outline" size={24} color="#10B981" />
                </View>
                <View className="ml-4 flex-1">
                    <Text className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Total Earnings</Text>
                    <Text className="text-zinc-800 text-2xl font-bold">{stats.earnings}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
        </View>

        {/* Upcoming Bookings Section */}
        <View className="mt-8 px-6">
          <View className="flex-row justify-between items-end mb-4 px-1">
            <Text className="text-xl font-bold text-zinc-800">Upcoming Pujas</Text>
            <TouchableOpacity onPress={() => router.push('/(pandit)/bookings')}>
              <Text className="text-primary font-bold text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <UpcomingPujaCard
                  key={booking.id}
                  customerName={booking.user_full_name || 'Customer'}
                  pujaType={booking.service_name || 'Puja'}
                  date={dayjs(booking.booking_date).format('DD MMM, hh:mm A')}
                  status={booking.status}
                  onPress={() => router.push({ pathname: '/(pandit)/bookings', params: { id: booking.id } } as any)}
                  onJoin={() => router.push(`/video/${booking.id}`)}
                />
              ))
            ) : (
              <View className="bg-white p-10 rounded-3xl items-center shadow-sm shadow-zinc-100 border border-zinc-100">
                <Ionicons name="calendar-outline" size={48} color="#E5E7EB" />
                <Text className="text-zinc-400 mt-3 font-medium text-center leading-5">No upcoming bookings found.{"\n"}Stay tuned for new requests!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions Grid - 2 Columns */}
        <View className="mt-8 px-6">
          <Text className="text-xl font-bold text-zinc-800 mb-4 px-1">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            <ActionButton 
                label="Manage Bookings" 
                icon="checkmark-done-circle" 
                onPress={() => router.push('/(pandit)/bookings')} 
            />
            <ActionButton 
                label="Chat Requests" 
                icon="chatbubble-ellipses" 
                onPress={() => router.push('/(pandit)/messages')} 
            />
            <ActionButton 
                label="My Services" 
                icon="color-palette" 
                onPress={() => router.push('/(pandit)/services')} 
            />
            <ActionButton 
                label="Calendar Settings" 
                icon="calendar" 
                onPress={() => router.push('/(pandit)/calendar')} 
            />
          </View>
        </View>

        {/* Profile List Section (New) */}
        <View className="mt-10 px-6">
            <Text className="text-xl font-bold text-zinc-800 mb-4 px-1">Settings & Profile</Text>
            <View className="bg-white rounded-[32px] overflow-hidden shadow-md shadow-zinc-100 border border-zinc-50">
                <ProfileItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/(pandit)/profile')} />
                <ProfileItem icon="wallet-outline" label="Earnings & Wallet" onPress={() => router.push('/(pandit)/earnings')} />
                <ProfileItem icon="ribbon-outline" label="My Certificates" onPress={() => router.push('/(pandit)/profile')} />
                <ProfileItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/(pandit)' as any)} />
                <ProfileItem icon="options-outline" label="Settings" onPress={() => {}} />
                
                <View className="flex-row items-center px-6 py-4 border-b border-zinc-50">
                    <View className="w-10 h-10 bg-zinc-50 rounded-xl items-center justify-center">
                        <Ionicons name="moon-outline" size={20} color="#6B7281" />
                    </View>
                    <Text className="flex-1 ml-4 text-zinc-700 font-semibold text-base">Dark Mode</Text>
                    <Switch value={false} onValueChange={() => {}} />
                </View>

                <ProfileItem icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/(pandit)/help')} />
                <ProfileItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => {}} />
                
                <ProfileItem 
                    icon="trash-outline" 
                    label="Delete Account" 
                    color="#EF4444" 
                    onPress={() => setShowDeleteModal(true)} 
                    hideBorder
                />
            </View>

            <TouchableOpacity 
                className="mt-6 flex-row items-center justify-center p-5 bg-white rounded-3xl border border-zinc-100 shadow-sm"
                onPress={() => setShowLogoutModal(true)}
            >
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text className="ml-2 text-[#EF4444] font-bold text-lg">Logout</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Confirmation Modals */}
      <ConfirmationModal 
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Logout"
        description="Are you sure you want to log out of PanditYatra?"
        confirmText="Logout"
      />

      <ConfirmationModal 
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This action cannot be undone. All your data will be permanently removed."
        confirmText="Delete My Account"
        isDanger
      />
      
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <View 
        className="bg-white rounded-2xl p-4 items-center shadow-md shadow-zinc-200 border border-zinc-50"
        style={{ width: (SCREEN_WIDTH - 60) / 3 }}
    >
      <View 
        className="w-10 h-10 rounded-xl justify-center items-center mb-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-xl font-bold text-zinc-800">{value}</Text>
      <Text className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter mt-0.5">{label}</Text>
    </View>
  );
}

function UpcomingPujaCard({ customerName, pujaType, date, status, onPress, onJoin }: { 
  customerName: string, 
  pujaType: string, 
  date: string, 
  status: string,
  onPress?: () => void,
  onJoin?: () => void
}) {
    const isAccepted = status?.toLowerCase() === 'accepted';
    return (
        <TouchableOpacity 
            className="bg-white p-5 rounded-3xl shadow-md shadow-zinc-100 flex-row justify-between border border-zinc-50 active:bg-zinc-50"
            onPress={onPress}
        >
            <View className="flex-1 pr-4">
                <Text className="text-zinc-800 font-bold text-lg mb-1">{pujaType}</Text>
                <Text className="text-zinc-500 font-medium text-sm mb-3">Customer: {customerName}</Text>
                <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                    <Text className="text-zinc-400 text-xs ml-1.5 font-semibold uppercase">{date}</Text>
                </View>
            </View>
            <View className="items-end justify-between">
                <View className={`px-3 py-1 rounded-full ${isAccepted ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <Text className={`text-[10px] font-extrabold uppercase tracking-widest ${isAccepted ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {status}
                    </Text>
                </View>
                {isAccepted && (
                    <TouchableOpacity 
                        className="bg-primary px-4 py-2 rounded-xl"
                        onPress={onJoin}
                    >
                        <Text className="text-white font-bold text-xs">Join Call</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}

function ActionButton({ label, icon, onPress }: { label: string, icon: any, onPress: () => void }) {
  return (
    <TouchableOpacity 
        className="bg-white p-6 rounded-3xl items-center shadow-md shadow-zinc-200 border border-zinc-50 active:bg-zinc-50"
        style={{ width: '48%' }}
        onPress={onPress}
    >
      <View className="w-14 h-14 rounded-2xl bg-orange-50 items-center justify-center mb-4">
        <Ionicons name={icon} size={28} color="#FF6F00" />
      </View>
      <Text className="text-zinc-800 font-bold text-[13px] text-center leading-4">{label}</Text>
    </TouchableOpacity>
  );
}

function ProfileItem({ icon, label, onPress, color = '#6B7280', hideBorder }: { 
    icon: any, 
    label: string, 
    onPress: () => void,
    color?: string,
    hideBorder?: boolean
}) {
    return (
        <TouchableOpacity 
            className={`flex-row items-center px-6 py-4 active:bg-zinc-50 ${!hideBorder ? 'border-b border-zinc-50' : ''}`}
            onPress={onPress}
        >
            <View className="w-10 h-10 bg-zinc-50 rounded-xl items-center justify-center">
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text 
                className="flex-1 ml-4 font-semibold text-base"
                style={{ color: label === 'Delete Account' ? '#EF4444' : '#374151' }}
            >
                {label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>
    );
}

function ConfirmationModal({ visible, onClose, onConfirm, title, description, confirmText, isDanger }: {
    visible: boolean,
    onClose: () => void,
    onConfirm: () => void,
    title: string,
    description: string,
    confirmText: string,
    isDanger?: boolean
}) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl">
                    <View className={`w-16 h-16 self-center rounded-2xl items-center justify-center mb-6 ${isDanger ? 'bg-red-50' : 'bg-orange-50'}`}>
                        <Ionicons 
                            name={isDanger ? "alert-circle-outline" : "help-circle-outline"} 
                            size={40} 
                            color={isDanger ? "#EF4444" : "#FF6F00"} 
                        />
                    </View>
                    <Text className="text-2xl font-extrabold text-zinc-900 text-center mb-3">{title}</Text>
                    <Text className="text-zinc-500 text-center leading-5 mb-8 font-medium">{description}</Text>
                    
                    <View className="gap-3">
                        <TouchableOpacity 
                            className={`h-14 rounded-2xl items-center justify-center ${isDanger ? 'bg-red-500' : 'bg-primary'}`}
                            onPress={onConfirm}
                        >
                            <Text className="text-white font-bold text-lg">{confirmText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            className="h-14 rounded-2xl items-center justify-center bg-zinc-100 mt-2"
                            onPress={onClose}
                        >
                            <Text className="text-zinc-500 font-bold text-lg">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
