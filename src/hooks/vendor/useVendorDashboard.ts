import { useState, useCallback, useEffect, useRef } from 'react';
import { getVendorStats, VendorStats, getVendorProfile, VendorProfile } from '@/services/vendor.service';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'expo-router';

export const useVendorDashboard = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [stats, setStats] = useState<VendorStats | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const isMounted = useRef(true);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadData = useCallback(async () => {
    if (isFetching.current) return;
    
    // Auth Guard
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
        if (isMounted.current) setLoading(false);
        return;
    }

    isFetching.current = true;
    try {
      const [statsRes, profileRes] = await Promise.all([
        getVendorStats(),
        getVendorProfile()
      ]);
      
      setStats(statsRes.data);
      
      // vendors/profile/ returns a list; extract the first profile
      const profileData = Array.isArray(profileRes.data) ? profileRes.data[0] : profileRes.data;
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to load vendor dashboard data:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isFetching.current = false;
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Removed mount Effect to prevent infinite loops.
  // Screens should use useFocusEffect to trigger loadData.

  return {
    user,
    profile,
    stats,
    loading,
    refreshing,
    onRefresh,
    loadData,
    router
  };
};
