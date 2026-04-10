import { useState, useCallback, useEffect } from 'react';
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

  const loadData = useCallback(async () => {
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
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
