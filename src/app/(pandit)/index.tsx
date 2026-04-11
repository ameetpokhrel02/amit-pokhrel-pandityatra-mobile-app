// Version: 1.0.1 - Fixed JSX Syntax
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { getImageUrl } from '@/utils/image';
import { usePanditDashboard } from '@/hooks/pandit/usePanditDashboard';
import { UpcomingSessionBanner } from '@/components/booking/UpcomingSessionBanner';
import { useCartStore } from '@/store/cart.store';
import { useTheme } from '@/store/ThemeContext';
import { addToCart as addToCartApi } from '@/services/samagri.service';
import dayjs from 'dayjs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PanditDashboardScreen() {
  const router = useRouter();
  const {
    user,
    profile,
    stats,
    myServices,
    samagriItems,
    categories,
    isAvailable,
    loading: loading,
    refreshing: refreshing,
    nextSession: nextSession,
    unreadCount: unreadCount,
    totalItems: totalItems,
    onRefresh: onRefresh,
    fetchData: fetchData,
    handleToggleAvailability,
    handleLogout,
    getTimeBasedGreeting
  } = usePanditDashboard();

  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );
  const { addToCart, syncCart } = useCartStore();

  const handleAddToCart = async (item: any) => {
    try {
      // Optimistic Update
      addToCart({ ...item, id: String(item.id) } as any);

      // Backend Sync
      const cartRes = await addToCartApi(item.id, 1);
      if (cartRes) {
        syncCart(cartRes.items || cartRes);
      }
    } catch (error) {
      console.warn('Silently failed to sync cart with backend', error);
      // Even if backend fails, we keep the local state for a smooth UI
    }
  };

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#FF6F00" />
        <Text style={{ marginTop: 16, color: '#6B7280', fontWeight: '500' }}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6F00" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F00" />
        }
      >
        {/* Header - Saffron Theme */}
        <View style={{ backgroundColor: '#FF6F00', paddingTop: 20, paddingBottom: 60, paddingHorizontal: 24, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 2, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', marginRight: 16 }}
                onPress={() => router.push('/(pandit)/profile')}
              >
                {user?.profile_pic_url || profile?.profile_image || profile?.profile_pic ? (
                  <Image
                    source={{ uri: getImageUrl(user?.profile_pic_url || profile?.profile_image || profile?.profile_pic) || undefined }}
                    style={{ width: 52, height: 52, borderRadius: 26 }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="person" size={24} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 }}>{getTimeBasedGreeting()}</Text>
                <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '800' }}>
                  Namaste, {user?.name?.split(' ')[0] || profile?.full_name?.split(' ')[0] || 'Pandit Ji'}!
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 16 }}
                onPress={() => router.push('/(pandit)/cart' as any)}
              >
                <Ionicons name="bag-handle-outline" size={24} color="#FFF" />
                {totalItems > 0 && (
                  <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, backgroundColor: '#FFF', borderRadius: 9, borderWidth: 2, borderColor: '#FF6F00', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
                    <Text style={{ color: '#FF6F00', fontSize: 9, fontWeight: 'bold' }}>
                      {totalItems > 9 ? '9+' : totalItems}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 16 }}
                onPress={() => router.push('/notifications' as any)}
              >
                <Ionicons name="notifications-outline" size={24} color="#FFF" />
                {unreadCount > 0 && (
                  <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, backgroundColor: '#EF4444', borderRadius: 9, borderWidth: 2, borderColor: '#FF6F00', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
              <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 6, textTransform: 'uppercase' }}>Verified</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: isAvailable ? '#FFF' : 'rgba(255,255,255,0.6)' }}>
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

        {/* Pending Approval Banner - Story Requirement */}
        {profile?.pandit_profile?.is_verified === false && (
          <View 
            className="mx-6 mt-6 p-5 rounded-3xl flex-row items-center gap-4 border" 
            style={{ 
              backgroundColor: isDark ? '#3B2200' : '#FEF3C7', 
              borderColor: isDark ? '#4B3F2E' : '#F59E0B' 
            }}
          >
            <View className="w-10 h-10 rounded-2xl items-center justify-center bg-amber-500/10">
              <Ionicons name="time" size={22} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold" style={{ color: isDark ? '#E5D5C5' : '#92400E' }}>Verification Pending</Text>
              <Text className="text-xs mt-0.5 opacity-80" style={{ color: isDark ? '#D1BFA9' : '#B45309' }}>Our admin is reviewing your certificates. This usually takes 24 hours.</Text>
            </View>
          </View>
        )}

        {/* COMPONENT: VIDEO CALL REMINDER BANNER */}
        {nextSession && <UpcomingSessionBanner booking={nextSession} role="pandit" />}

        {/* Stats Grid */}
        <View style={{ marginTop: -40, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <StatCard label="Pending" value={stats.pending} icon="time" color="#FF6F00" />
            <StatCard label="Upcoming" value={stats.upcoming} icon="calendar" color="#3B82F6" />
            <StatCard label="Reviews" value={stats.rating} icon="star" color="#FFD700" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}
            onPress={() => router.push('/(pandit)/earnings')}
          >
            <View style={{ width: 48, height: 48, backgroundColor: '#ECFDF5', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="wallet-outline" size={24} color="#10B981" />
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>Total Earnings</Text>
              <Text style={{ color: '#1F2937', fontSize: 24, fontWeight: 'bold' }}>NPR {stats.earnings}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* My Services Section */}
        <View style={{ marginTop: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 28 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>My Services</Text>
            <TouchableOpacity onPress={() => router.push('/(pandit)/services' as any)}>
              <Text style={{ color: '#FF6F00', fontWeight: 'bold', fontSize: 14 }}>Manage All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
            {myServices.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={{ backgroundColor: '#FFF', borderRadius: 24, width: 220, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                onPress={() => router.push('/(pandit)/services' as any)}
              >
                <Image
                  source={{ uri: getImageUrl(service.puja_details?.image) || 'https://images.unsplash.com/photo-1544158404-585ff67ece33?q=80&w=400' }}
                  style={{ width: '100%', height: 120 }}
                  contentFit="cover"
                />
                <View style={{ padding: 16 }}>
                  <Text style={{ color: '#1F2937', fontWeight: '800', fontSize: 15, marginBottom: 4 }} numberOfLines={1}>
                    {service.puja_details?.name}
                  </Text>
                  <Text style={{ color: '#FF6F00', fontWeight: '900', fontSize: 18, marginBottom: 12 }}>NPR {service.custom_price || service.price}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                    <Ionicons name="time-outline" size={12} color="#6B7280" />
                    <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: 'bold', marginLeft: 4 }}>{service.duration_minutes}M</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {myServices.length === 0 && (
              <View style={{ width: SCREEN_WIDTH - 48, backgroundColor: '#FFF', padding: 40, borderRadius: 24, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' }}>
                <Ionicons name="sparkles-outline" size={32} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', fontWeight: '500', marginTop: 12 }}>No services added yet.</Text>
                <TouchableOpacity
                  style={{ marginTop: 16, backgroundColor: '#FF6F00', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
                  onPress={() => router.push('/(pandit)/services' as any)}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Add First Service</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Sacred Samagri Section */}
        {samagriItems.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 28 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? colors.text : '#1F2937' }}>Sacred Samagri</Text>
              <TouchableOpacity onPress={() => router.push('/(pandit)/cart')}>
                <Text style={{ color: '#FF6F00', fontWeight: 'bold', fontSize: 14 }}>Go to Cart</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
              {samagriItems.map((item) => (
                <View
                  key={item.id}
                  style={{ backgroundColor: '#FFF', borderRadius: 24, width: 180, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, padding: 12, position: 'relative' }}
                >
                  <Image
                    source={{ uri: item.image || undefined }}
                    style={{ width: '100%', height: 120, borderRadius: 16 }}
                    contentFit="cover"
                  />
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: '#1F2937', fontWeight: '700', fontSize: 14, marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ color: '#FF6F00', fontWeight: '800', fontSize: 16 }}>NPR {item.price}</Text>
                  </View>
                  <TouchableOpacity
                    style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: '#FF6F00', width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ marginTop: 32, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}>
            <QuickActionItem label="Manage Bookings" icon="calendar" color="#4F46E5" onPress={() => router.push('/(pandit)/bookings')} />
            <QuickActionItem label="View Calendar" icon="time" color="#0EA5E9" onPress={() => router.push('/(pandit)/calendar')} />
            <QuickActionItem label="View Market" icon="basket" color="#FF6F00" onPress={() => router.push('/(pandit)')} />
            <QuickActionItem label="Earnings Stats" icon="stats-chart" color="#10B981" onPress={() => router.push('/(pandit)/earnings')} />
          </View>
        </View>

        {/* App Feedback Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 32, marginBottom: 40 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              padding: 20, borderRadius: 24, borderWidth: 1, backgroundColor: colors.card, borderColor: isDark ? '#2A2A2E' : '#F0F0F0'
            }}
            onPress={() => router.push('/(customer)/reviews/app-reviews' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary + '20', overflow: 'hidden' }}>
                <Image
                  source={require('@/assets/images/pandit-logo.png')}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 2, color: colors.text }}>Love PanditYatra?</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text + '80' }}>Share your feedback with us</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '50'} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Logout"
        description="Are you sure you want to log out of PanditYatra?"
        confirmText="Logout"
      />
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${color}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function QuickActionItem({ label, icon, color, onPress }: { label: string, icon: any, color: string, onPress: () => void }) {
  return (
    <TouchableOpacity
      style={{ width: (SCREEN_WIDTH - 64) / 2, backgroundColor: '#FFF', padding: 20, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      onPress={onPress}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${color}10`, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={{ color: '#374151', fontWeight: 'bold', fontSize: 13 }}>{label}</Text>
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
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: '#FFF', width: '100%', maxWidth: 340, borderRadius: 32, padding: 32, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: isDanger ? '#FEF2F2' : '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <Ionicons name={isDanger ? "alert-circle" : "exit"} size={32} color={isDanger ? "#EF4444" : "#FF6F00"} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>{description}</Text>
          <View style={{ width: '100%', gap: 12 }}>
            <TouchableOpacity
              style={{ width: '100%', height: 56, backgroundColor: isDanger ? '#EF4444' : '#FF6F00', borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
              onPress={onConfirm}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>{confirmText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: '100%', height: 56, backgroundColor: '#F3F4F6', borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
              onPress={onClose}
            >
              <Text style={{ color: '#6B7280', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
