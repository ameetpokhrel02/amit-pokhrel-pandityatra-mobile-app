import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { fetchProfile } from '@/services/auth.service';
import { togglePanditAvailability, fetchPanditMyServices } from '@/services/pandit.service';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { useCartStore } from '@/store/cart.store';
import { fetchSamagriItems, fetchSamagriCategories } from '@/services/samagri.service';
import { listBookings } from '@/services/booking.service';
import { Booking } from '@/services/api';

export const usePanditDashboard = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout: storeLogout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { totalItems } = useCartStore();

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
  const [samagriItems, setSamagriItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [nextSession, setNextSession] = useState<Booking | null>(null);
  
  // Prevention of memory leaks and redundant fetches
  const isMounted = useRef(true);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    
    // Auth Guard: Only fetch if authenticated
    if (!isAuthenticated) {
      if (isMounted.current) setLoading(false);
      return;
    }
    
    isFetching.current = true;
    try {
      if (!refreshing) setLoading(true);
      const profileRes = await fetchProfile();
      const profileData = profileRes.data || profileRes;
      setProfile(profileData);

      if (profileData.pandit_profile) {
        setIsAvailable(profileData.pandit_profile.is_available);
        setStats({
          pending: profileData.pandit_profile.pending_bookings?.toString() || '0',
          upcoming: profileData.pandit_profile.upcoming_bookings?.toString() || '0',
          earnings: `NPR ${profileData.pandit_profile.total_earnings || 0}`,
          rating: (profileData.pandit_profile.average_rating || profileData.pandit_profile.rating || 0).toFixed(1)
        });
      }

      const servicesRes = await fetchPanditMyServices();
      setMyServices(servicesRes.data || []);

      const [items, cats] = await Promise.all([
          fetchSamagriItems(),
          fetchSamagriCategories()
      ]);
      setSamagriItems(items.slice(0, 8));
      setCategories(cats);

      // Fetch next imminent session for banner
      const bookingsRes = await listBookings({ status: 'ACCEPTED' });
      const upcoming = (bookingsRes.data || []).sort((a: Booking, b: Booking) => {
        return new Date(`${a.booking_date} ${a.booking_time}`).getTime() - 
               new Date(`${b.booking_date} ${b.booking_time}`).getTime();
      });
      setNextSession(upcoming[0] || null);

      await fetchNotifications();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
      isFetching.current = false;
    }
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Removed mount useEffect because fetchData is triggered by useFocusEffect in the screen

  const handleToggleAvailability = async (value: boolean) => {
    try {
      setIsAvailable(value);
      await togglePanditAvailability(value);
    } catch (error) {
      console.error('Error toggling availability:', error);
      setIsAvailable(!value);
    }
  };

  const handleLogout = async () => {
    await storeLogout();
    router.replace('/(auth)/user/login' as any);
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "GOOD MORNING!";
    if (hour < 17) return "GOOD AFTERNOON!";
    return "GOOD EVENING!";
  };

  return {
    user,
    profile,
    stats,
    myServices,
    samagriItems,
    categories,
    isAvailable,
    loading,
    refreshing,
    nextSession,
    unreadCount,
    totalItems,
    onRefresh,
    fetchData,
    handleToggleAvailability,
    handleLogout,
    getTimeBasedGreeting
  };
};
