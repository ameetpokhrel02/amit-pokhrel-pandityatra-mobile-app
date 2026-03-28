import { useState, useCallback, useEffect } from 'react';
import { getVendorStats, VendorStats } from '@/services/vendor.service';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'expo-router';

export const useVendorDashboard = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await getVendorStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load vendor stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    user,
    logout,
    stats,
    loading,
    refreshing,
    onRefresh,
    router
  };
};
