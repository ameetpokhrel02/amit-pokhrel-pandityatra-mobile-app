import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  getVendorStats, VendorStats, 
  getVendorProfile, VendorProfile,
  listVendorProducts, VendorProduct,
  listVendorOrders, VendorOrder
} from '@/services/vendor.service';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'expo-router';

export const useVendorDashboard = () => {
  const router = useRouter();
  const { user } = useAuthStore();

  const [stats, setStats] = useState<VendorStats | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<VendorOrder[]>([]);
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
      const [statsRes, profileRes, productsRes, ordersRes] = await Promise.all([
        getVendorStats(),
        getVendorProfile(),
        listVendorProducts(),
        listVendorOrders()
      ]);
      
      // Handle potential wrapped stats
      const statsData = statsRes.data?.stats || statsRes.data;
      setStats(statsData);
      
      // vendors/profile/ returns a list or a single object
      const profileData = Array.isArray(profileRes.data) 
        ? profileRes.data[0] 
        : (profileRes.data?.profile || profileRes.data);
      setProfile(profileData);

      // Handle products
      const pData = productsRes.data?.results || productsRes.data;
      setProducts(Array.isArray(pData) ? pData : []);

      // Handle orders (Recent 5)
      const oData = ordersRes.data?.results || ordersRes.data;
      const allOrders = Array.isArray(oData) ? oData : [];
      setRecentOrders(allOrders.slice(0, 5));

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

  const lowStockItems = products.filter(p => (p.stock_quantity ?? 0) <= 5);

  return {
    user,
    profile,
    stats,
    products,
    recentOrders,
    lowStockItems,
    loading,
    refreshing,
    onRefresh,
    loadData,
    router
  };
};
