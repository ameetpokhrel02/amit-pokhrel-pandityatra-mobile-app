import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notification.store";
import { fetchServices } from "@/services/puja.service";
import { listPandits } from "@/services/pandit.service";
import { listBookings } from "@/services/booking.service";
import { fetchBookingSamagriRecommendations } from "@/services/recommender.service";
import { getSamagriItems, getSamagriCategories, getWishlist, toggleWishlist } from "@/services/samagri.service";
import { Service, Pandit, Booking, SamagriItem, SamagriCategory } from "@/services/api";

export const useDashboardData = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { fetchNotifications: fetchStoreNotifications } = useNotificationStore();

  const [services, setServices] = useState<Service[]>([]);
  const [pandits, setPandits] = useState<Pandit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recommendations, setRecommendations] = useState<SamagriItem[]>([]);
  const [samagriItems, setSamagriItems] = useState<SamagriItem[]>([]);
  const [samagriCategories, setSamagriCategories] = useState<SamagriCategory[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // We memoize loadHomeData to satisfy eslint dependency rules
  const loadHomeData = useCallback(async () => {
    try {
      const [servicesData, panditsRes, samagriItemsRes, samagriCategoriesRes] = await Promise.all([
        fetchServices(),
        listPandits(),
        getSamagriItems(),
        getSamagriCategories(),
      ]);
      setServices(servicesData.slice(0, 6));
      setPandits(panditsRes.data?.results || panditsRes.data?.slice(0, 6) || []);
      setSamagriItems(samagriItemsRes);
      setSamagriCategories(samagriCategoriesRes);

      if (isAuthenticated && user) {
        fetchStoreNotifications();
        
        try {
            const wishlistRes = await getWishlist();
            const wishlistData = Array.isArray(wishlistRes) ? wishlistRes : (wishlistRes as any)?.results || [];
            const ids = wishlistData.map((w: any) => w.item?.id || w.samagri_item?.id || w.id).filter(Boolean);
            setWishlist(ids);
        } catch (wishlistErr) {
            console.warn("Could not fetch wishlist", wishlistErr);
        }

        const bookingsRes = await listBookings({ status: 'PENDING' });
        const bookingsData = bookingsRes.data;
        setBookings(bookingsData);

        if (bookingsData.length > 0) {
          try {
            const recoData = await fetchBookingSamagriRecommendations(bookingsData[0].id);
            setRecommendations(recoData);
          } catch (recoErr) {
            console.warn("Could not fetch recommendations", recoErr);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load home data", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchStoreNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  }, [loadHomeData]);

  const handleAuthAction = useCallback((pathname: string, params?: any) => {
    if (!isAuthenticated) {
      router.push('/(public)/role-selection');
      return;
    }
    router.push({ pathname: pathname as any, params });
  }, [isAuthenticated, router]);

  const handleToggleWishlist = async (itemId: number) => {
    if (!isAuthenticated) {
        handleAuthAction('/(customer)/wishlist');
        return;
    }
    try {
        await toggleWishlist(itemId);
        const wishlistRes = await getWishlist();
        const wishlistData = Array.isArray(wishlistRes) ? wishlistRes : (wishlistRes as any)?.results || [];
        const ids = wishlistData.map((w: any) => w.item?.id || w.samagri_item?.id || w.id).filter(Boolean);
        setWishlist(ids);
    } catch (err) {
        Alert.alert('Error', 'Could not update wishlist');
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  return {
    services,
    pandits,
    bookings,
    recommendations,
    samagriItems,
    samagriCategories,
    wishlist,
    loading,
    refreshing,
    onRefresh,
    handleToggleWishlist,
    handleAuthAction
  };
};
